"use strict";

// The Vue Options API accesses template conditions through _ctx, which prevents
// minifiers from proving FEATURE_TRAINER=false. Remove only explicitly marked
// review/feedback additions BEFORE Vue/TypeScript compilation in the npokers build.
// The unmarked source is intentionally byte-equivalent to the pre-R2 source.
function stripMarked(source, marker) {
  const lines = source.split(/(?<=\n)/);
  const start = new RegExp(`^\\s*(?:<!-- ${marker}_START -->|// ${marker}_START)\\s*$`);
  const end = new RegExp(`^\\s*(?:<!-- ${marker}_END -->|// ${marker}_END)\\s*$`);
  const single = new RegExp(`// ${marker}\\s*$|/\\* ${marker} \\*/`);
  let inBlock = false;
  let output = "";
  for (const line of lines) {
    if (start.test(line)) {
      if (inBlock) throw new Error(`Nested ${marker} exclusion block`);
      inBlock = true;
    } else if (end.test(line)) {
      if (!inBlock) throw new Error(`Unmatched ${marker} exclusion end`);
      inBlock = false;
    } else if (!inBlock && !line.includes(marker)) {
      output += line;
    } else if (!inBlock && !single.test(line)) {
      throw new Error(`Unknown ${marker} exclusion marker`);
    }
  }
  if (inBlock) throw new Error(`Unclosed ${marker} exclusion block`);
  return output;
}

function stripReview(source) {
  return stripMarked(stripMarked(source, "R2_REVIEW_ONLY"), "F1_FEEDBACK_ONLY");
}

module.exports = function(source) {
  this.cacheable?.();
  return stripReview(source);
};
module.exports.stripReview = stripReview;

// Read-resource transformation keeps each module's loader chain/identifier
// unchanged, unlike adding a pre-loader. This preserves deterministic bundle IDs.
module.exports.ExcludeReviewPlugin = class ExcludeReviewPlugin {
  constructor(files) { this.files = new Set(files); }
  apply(compiler) {
    const name = "ExcludeReviewFromNpokers";
    compiler.hooks.compilation.tap(name, compilation => {
      compiler.webpack.NormalModule.getCompilationHooks(compilation).readResource
        .for(undefined).tapAsync({ name, stage: -100 }, (context, callback) => {
          if (!this.files.has(context.resourcePath)) return callback();
          context.fs.readFile(context.resourcePath, (error, bytes) => {
            if (error) return callback(error);
            context.addDependency(context.resourcePath);
            try { callback(null, stripReview(bytes.toString("utf8"))); }
            catch (failure) { callback(failure); }
          });
        });
    });
  }
};
