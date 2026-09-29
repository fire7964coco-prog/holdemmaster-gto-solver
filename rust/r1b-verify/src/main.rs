//! R1b verification only. No stored CFV is read by `reevaluate`.
use postflop_solver::*;
use rayon::prelude::*;
use serde_json::json;
use std::collections::BTreeMap;
use std::fs;
use std::mem::MaybeUninit;
use std::path::Path;
use std::sync::Mutex;
use std::time::Instant;

#[allow(dead_code)]
mod producer {
    include!("../../../../참고자료/사전계산_도구_2026-09-28/precompute3/src/main.rs");

    pub fn run(flop_text: &str, out: &Path) {
        let flop = flop_from_str(flop_text).unwrap();
        let sc = &SCENARIOS[0];
        let mut game = build(sc, flop);
        let compressed = false;
        eprintln!("{flop_text}: memory {:?}", game.memory_usage());
        game.allocate_memory(compressed);
        let t0 = Instant::now();
        let mut iterations = 0;
        let mut exploitability = f32::INFINITY;
        for it in 0..MAX_ITER {
            solve_step(&game, it);
            iterations = it + 1;
            if iterations >= 20 && iterations % 10 == 0 {
                exploitability = compute_exploitability(&game);
                eprintln!("{flop_text}: iteration {iterations} exploit_pct {:.5}", exploitability / sc.pot as f32 * 100.0);
                if exploitability <= sc.pot as f32 / 100.0 { break; }
            }
        }
        let seconds = t0.elapsed().as_secs_f64();
        finalize(&mut game);
        let mut nodes = Vec::new();
        walk(&mut game, &mut Vec::new(), &mut nodes);
        game.back_to_root();
        game.cache_normalized_weights();
        let weights = [game.weights(0).to_vec(), game.weights(1).to_vec()];
        let solved = Solved { target_pct: 1.0, weights, iterations, exploit_pct: exploitability / sc.pot as f32 * 100.0, seconds, compressed };
        let flop_weight = canonical_flops().iter().find(|(f,_)|f==&flop).expect("canonical test flop").1;
        write_file(sc, &out.join(format!("{flop_text}.bin")), &flop, flop_weight, &game, &nodes, &solved);
        super::verify(&mut game, sc.pot, flop_text, out, iterations, exploitability, seconds);
    }
}

type Records = Mutex<BTreeMap<Vec<usize>, Vec<Vec<f64>>>>;

// Independently normalize the frozen strategy; no engine normalized_strategy
// helper and no saved CFV access. f32 probabilities are the actual engine policy.
fn policy<T: Game>(game: &T, node: &T::Node) -> Vec<f64> {
    let actions = node.num_actions();
    let n = game.num_private_hands(node.player());
    let raw: Vec<f32> = if game.is_compression_enabled() {
        node.strategy_compressed().iter().map(|&x| x as f32).collect()
    } else { node.strategy().to_vec() };
    let mut p = vec![0.0; raw.len()];
    for h in 0..n {
        let mut sum = 0.0f32;
        for a in 0..actions { sum += raw[a*n+h]; }
        for a in 0..actions { p[a*n+h] = (if sum > 0.0 { raw[a*n+h] / sum } else { 1.0 / actions as f32 }) as f64; }
    }
    assert!(game.locking_strategy(node).is_empty(), "Verifier does not support node locking");
    p
}

// Full enumeration of the action tree under frozen strategies. Opponent reach
// and all accumulated values use f64. Terminal payout evaluation and suit
// isomorphism metadata are shared with the engine, and are disclosed limitations.
// Importantly, this never reads cfvalues, expected_values*, or normalized_weights.
fn reevaluate<T: Game>(game: &T, node: &T::Node, player: usize, reach: &[f64], path: Option<Vec<usize>>, records: &Records) -> Vec<f64> {
    let n = game.num_private_hands(player);
    if node.is_terminal() {
        let reach32: Vec<f32> = reach.iter().map(|&v| v as f32).collect();
        let mut value: Vec<MaybeUninit<f32>> = vec![MaybeUninit::uninit(); n];
        game.evaluate(&mut value, node, player, &reach32);
        return value.into_iter().map(|v| unsafe { v.assume_init() } as f64).collect();
    }
    let actions = node.num_actions();
    let chance = node.is_chance();
    let p = if chance { Vec::new() } else { policy(game, node) };
    let branch = |a: usize| {
        let updated: Vec<f64> = if chance {
            reach.iter().map(|v| v / game.chance_factor(node) as f64).collect()
        } else if node.player() != player {
            reach.iter().enumerate().map(|(h,v)| v*p[a*reach.len()+h]).collect()
        } else { reach.to_vec() };
        let next_path = if chance { None } else { path.as_ref().map(|p| { let mut q = p.clone(); q.push(a); q }) };
        reevaluate(game, &*node.play(a), player, &updated, next_path, records)
    };
    let children: Vec<Vec<f64>> = if node.enable_parallelization() {
        (0..actions).into_par_iter().map(branch).collect()
    } else { (0..actions).map(branch).collect() };
    let mut total = vec![0.0; n];
    for a in 0..actions {
        for h in 0..n { total[h] += children[a][h] * if !chance && node.player() == player { p[a*n+h] } else { 1.0 }; }
    }
    if chance {
        for (i, &representative) in game.isomorphic_chances(node).iter().enumerate() {
            let mut value = children[representative as usize].clone();
            for &(a,b) in &game.isomorphic_swap(node, i)[player] { value.swap(a as usize,b as usize); }
            for h in 0..n { total[h] += value[h]; }
        }
    } else if node.player() == player {
        if let Some(p) = path { records.lock().unwrap().insert(p, children); }
    }
    total
}

fn encode(v: f32) -> i16 { if v.is_nan() { i16::MIN } else { (v*10.0).round().clamp(-32767.0,32767.0) as i16 } }
fn median(values: &mut [f64]) -> f64 {
    if values.is_empty() { return 0.0; }
    values.sort_by(f64::total_cmp);
    let n=values.len(); if n%2==0 { (values[n/2-1]+values[n/2])*0.5 } else { values[n/2] }
}

fn verify(game: &mut PostFlopGame, pot: i32, flop: &str, out: &Path, iterations: u32, exploitability: f32, seconds: f64) {
    game.back_to_root();
    let mut combinations = 0.0f64;
    for (i,&(a,b)) in game.private_cards(0).iter().enumerate() {
        for (j,&(c,d)) in game.private_cards(1).iter().enumerate() {
            if a!=c && a!=d && b!=c && b!=d { combinations += game.weights(0)[i] as f64 * game.weights(1)[j] as f64; }
        }
    }
    let records = Records::default();
    let t = Instant::now();
    for player in 0..2 {
        eprintln!("{flop}: frozen evaluator player {player}");
        let reach: Vec<f64> = game.initial_weights(player^1).iter().map(|&v|v as f64).collect();
        reevaluate(game, &*game.root(), player, &reach, Some(Vec::new()), &records);
    }
    let eval_seconds=t.elapsed().as_secs_f64();
    let records = records.into_inner().unwrap();
    let mut old_bit_differences=0u64;
    let mut cells=0u64;
    let mut positive_cells=0u64;
    let mut positive_defined_cells=0u64;
    let mut positive_undefined_cells=0u64;
    let mut positive_max=0.0f64;
    let mut positive_max_location=json!(null);
    let mut positive_i16_differences=0u64;
    let mut pairs=0u64;
    let mut v1_missing=0u64;
    let mut v2_missing=0u64;
    let mut zero_pairs=0u64;
    let mut undefined_mass=0u64;
    let mut undefined_board=0u64;
    let mut missing_unexplained=0u64;
    let mut zero_errors=Vec::new();
    let mut positive_errors=Vec::new();
    let mut zero_max=0.0f64;
    let mut zero_location=json!(null);
    let mut positive_ref_max=0.0f64;
    let mut zero_i16_differences=0u64;
    let mut sample_rows=Vec::new();
    let mut old_bytes=Vec::new();
    let mut baseline_bytes=Vec::new();
    let mut old_api_seconds=0.0f64;
    let mut new_api_seconds=0.0f64;
    let api_timing_repetitions=20;
    for (path,cf) in &records {
        game.apply_history(path);
        game.cache_normalized_weights();
        let player=game.current_player();
        let actions=game.available_actions();
        let n=game.num_private_hands(player);
        let old=game.expected_values_detail(player);
        let baseline=game.expected_values_detail_r1_baseline(player);
        let new=game.expected_values_detail_counterfactual(player);
        // Paired local microbenchmark isolates export overhead from solving.
        // Alternate order to reduce a consistent warm-cache order advantage.
        for repeat in 0..api_timing_repetitions {
            if repeat%2==0 {
                let t=Instant::now();std::hint::black_box(game.expected_values_detail(player));old_api_seconds+=t.elapsed().as_secs_f64();
                let t=Instant::now();std::hint::black_box(game.expected_values_detail_counterfactual(player));new_api_seconds+=t.elapsed().as_secs_f64();
            } else {
                let t=Instant::now();std::hint::black_box(game.expected_values_detail_counterfactual(player));new_api_seconds+=t.elapsed().as_secs_f64();
                let t=Instant::now();std::hint::black_box(game.expected_values_detail(player));old_api_seconds+=t.elapsed().as_secs_f64();
            }
        }
        let board_mask=game.current_board().iter().fold(0u64,|m,&c|m|(1u64<<c));
        let offset=pot as f64*0.5+game.total_bet_amount()[player] as f64;
        for h in 0..n {
            pairs+=1;
            let (c1,c2)=game.private_cards(player)[h];
            let mask=(1u64<<c1)|(1u64<<c2);
            let mut mass=0.0f64;
            for (j,&(a,b)) in game.private_cards(player^1).iter().enumerate() {
                if ((1u64<<a)|(1u64<<b))&(mask|board_mask)==0 { mass+=game.weights(player^1)[j] as f64; }
            }
            let is_zero=game.weights(player)[h]==0.0;
            if is_zero { zero_pairs+=1; }
            let old_missing=actions.iter().enumerate().filter(|(_,a)|**a!=Action::Fold).all(|(a,_)|encode(old[a*n+h])==0);
            if old_missing {v1_missing+=1;}
            if (0..actions.len()).all(|a|new[a*n+h].is_nan()) {
                v2_missing+=1;
                if mask&board_mask!=0 {undefined_board+=1;} else if mass==0.0 {undefined_mass+=1;} else {missing_unexplained+=1;}
            }
            for (a,action) in actions.iter().enumerate() {
                let idx=a*n+h;
                cells+=1;
                old_bytes.extend_from_slice(&old[idx].to_le_bytes());
                baseline_bytes.extend_from_slice(&baseline[idx].to_le_bytes());
                if old[idx].to_bits()!=baseline[idx].to_bits() {old_bit_differences+=1;}
                if !is_zero {
                    positive_cells+=1;
                    if new[idx].is_finite() {
                        positive_defined_cells+=1;
                        let d=(old[idx] as f64-new[idx] as f64).abs();
                        if d>positive_max {positive_max=d;positive_max_location=json!({"path":path,"hand":[c1,c2],"action":format!("{action:?}")});}
                        if encode(old[idx])!=encode(new[idx]) {positive_i16_differences+=1;}
                    } else { positive_undefined_cells+=1; }
                }
                if mass>0.0 && mask&board_mask==0 && new[idx].is_finite() && *action!=Action::Fold {
                    let reference=cf[a][h]*combinations/mass+offset;
                    let error=(reference-new[idx] as f64).abs();
                    if is_zero {
                        zero_errors.push(error);
                        if encode(reference as f32)!=encode(new[idx]) {zero_i16_differences+=1;}
                        if error>zero_max {zero_max=error;zero_location=json!({"path":path,"hand":[c1,c2],"action":format!("{action:?}"),"new":new[idx],"reference":reference,"opponent_mass":mass});}
                        if sample_rows.len()<100 {sample_rows.push(json!({"path":path,"hand":[c1,c2],"action":format!("{action:?}"),"new":new[idx],"reference":reference,"error":error}));}
                    } else {positive_errors.push(error);positive_ref_max=positive_ref_max.max(error);}
                }
            }
        }
    }
    let zero_median=median(&mut zero_errors);
    let positive_ref_median=median(&mut positive_errors);
    let result=json!({"flop":flop,"iterations":iterations,"exploit_pct":exploitability/pot as f32*100.0,"solve_seconds":seconds,"independent_seconds":eval_seconds,"compressed":false,
        "nodes":records.len(),"cells":cells,"legacy_baseline_bit_differences":old_bit_differences,
        "positive_cells":positive_cells,"positive_defined_cells":positive_defined_cells,"positive_undefined_cells":positive_undefined_cells,"positive_max_chips":positive_max,"positive_max_location":positive_max_location,"positive_i16_differences":positive_i16_differences,
        "pairs":pairs,"zero_own_pairs":zero_pairs,"v1_missing_pairs":v1_missing,"v2_missing_pairs":v2_missing,"undefined_opponent_pairs":undefined_mass,"undefined_board_pairs":undefined_board,"missing_unexplained":missing_unexplained,
        "zero_independent_nonfold_cells":zero_errors.len(),"zero_independent_max_chips":zero_max,"zero_independent_median_chips":zero_median,"zero_independent_max_location":zero_location,"zero_independent_i16_differences":zero_i16_differences,
        "positive_independent_nonfold_cells":positive_errors.len(),"positive_independent_max_chips":positive_ref_max,"positive_independent_median_chips":positive_ref_median,
        "api_timing_repetitions":api_timing_repetitions,"old_api_ms_per_flop":old_api_seconds*1000.0/api_timing_repetitions as f64,"new_api_ms_per_flop":new_api_seconds*1000.0/api_timing_repetitions as f64,"samples":sample_rows});
    fs::write(out.join(format!("{flop}.json")),serde_json::to_vec_pretty(&result).unwrap()).unwrap();
    fs::write(out.join(format!("{flop}.legacy.bin")),old_bytes).unwrap();
    fs::write(out.join(format!("{flop}.baseline.bin")),baseline_bytes).unwrap();
    println!("{}",serde_json::to_string(&result).unwrap());
    assert_eq!(old_bit_differences,0);
    assert_eq!(positive_i16_differences,0);
    assert_eq!(missing_unexplained,0);
    assert!(!zero_errors.is_empty());
    assert!(zero_max<0.01,"Independent EV error exceeds 0.01 chip: {zero_max}");
}

fn main() {
    let args:Vec<String>=std::env::args().collect();
    let flop=args.get(1).expect("usage: r1b-verify Ah7d2c output-dir");
    let out=Path::new(args.get(2).expect("output directory"));
    fs::create_dir_all(out).unwrap();
    producer::run(flop,out);
}
