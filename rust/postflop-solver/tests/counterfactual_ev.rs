use postflop_solver::*;

fn river_game(oop: &str, ip: &str, compressed: bool) -> PostFlopGame {
    let cards = CardConfig {
        range: [oop.parse().unwrap(), ip.parse().unwrap()],
        flop: flop_from_str("2s3h4d").unwrap(),
        turn: card_from_str("6c").unwrap(),
        river: card_from_str("7c").unwrap(),
    };
    let tree = TreeConfig {
        initial_state: BoardState::River,
        starting_pot: 20,
        effective_stack: 10,
        river_bet_sizes: [("a", "").try_into().unwrap(), ("a", "").try_into().unwrap()],
        ..Default::default()
    };
    let mut game = PostFlopGame::with_config(cards, ActionTree::new(tree).unwrap()).unwrap();
    game.allocate_memory(compressed);
    game
}

#[test]
fn zero_own_reach_matches_independent_known_river_payoff() {
    for compressed in [false, true] {
        let mut game = river_game("AsAh,QsQh", "KsKh", compressed);
        // QQ checks; AA never checks. IP shoves after the check.
        game.lock_current_strategy(&[1.0, 0.0, 0.0, 1.0]);
        game.play(0);
        game.lock_current_strategy(&[0.0, 1.0]);
        game.back_to_root();
        finalize(&mut game);
        game.apply_history(&[0, 1]);
        game.cache_normalized_weights();
        assert_eq!(game.weights(0), &[1.0, 0.0]);
        let legacy = game.expected_values_detail(0);
        let new = game.expected_values_detail_counterfactual(0);
        assert_eq!(game.available_actions(), vec![Action::Fold, Action::Call]);
        assert_eq!(legacy[3], 0.0);
        // Independent arithmetic: AA beats KK on the complete board; winning
        // the 20-chip pot plus the opponent's 10-chip bet gives Call EV 30.
        assert!((new[3] - 30.0).abs() < 0.001, "{new:?}");
        assert!((new[2] + 10.0).abs() < 0.001, "{new:?}");
        assert_eq!(new[0], 0.0);
        assert_eq!(new[1], 0.0);
        assert!(new[1].is_finite()); // real zero is distinct from missing EV.
    }
}

#[test]
fn zero_opponent_reach_is_nan_for_every_action() {
    let mut game = river_game("AsAh,QsQh", "KsKh", false);
    game.lock_current_strategy(&[0.0, 0.0, 1.0, 1.0]);
    finalize(&mut game);
    game.play(0);
    game.cache_normalized_weights();
    assert!(game.expected_values_detail_counterfactual(1).iter().all(|v| v.is_nan()));
}

#[test]
fn card_removal_without_compatible_opponent_is_nan() {
    let mut game = river_game("AsAh,KsKh", "AsKd", false);
    finalize(&mut game);
    game.cache_normalized_weights();
    let aa = game.private_cards(0).iter().position(|&(a,b)| {
        let aces = [card_from_str("As").unwrap(),card_from_str("Ah").unwrap()];
        aces.contains(&a) && aces.contains(&b)
    }).unwrap();
    let values = game.expected_values_detail_counterfactual(0);
    for a in 0..game.available_actions().len() { assert!(values[a*2+aa].is_nan()); }
}

#[test]
fn dealt_board_overlap_is_nan() {
    let cards = CardConfig {
        range: ["AsAh,QsQh".parse().unwrap(), "KsKh".parse().unwrap()],
        flop: flop_from_str("2s3h4d").unwrap(),
        ..Default::default()
    };
    let tree = TreeConfig { starting_pot: 20, effective_stack: 10, ..Default::default() };
    let mut game = PostFlopGame::with_config(cards,ActionTree::new(tree).unwrap()).unwrap();
    game.allocate_memory(false);
    finalize(&mut game);
    game.apply_history(&[0,0,card_from_str("As").unwrap() as usize]);
    game.cache_normalized_weights();
    let values = game.expected_values_detail_counterfactual(0);
    assert!(values[1].is_nan());
    assert!(values[0].is_finite());
    assert_eq!(values[0].to_bits(),game.expected_values_detail(0)[0].to_bits());
}
