"use strict";

// The Vue Options API accesses template conditions through _ctx, which prevents
// minifiers from proving FEATURE_TRAINER=false. Remove only explicitly marked
// review additions BEFORE Vue/TypeScript compilation in the npokers build.
// The unmarked source is intentionally byte-equivalent to the pre-R2 source.
function stripReview(source) {
  const lines = source.split(/(?<=\n)/);
  let inBlock = false;
  let output = "";
  for (const line of lines) {
    if (/^\s*<!-- R2_REVIEW_ONLY_START -->\s*$/.test(line)) {
      if (inBlock) throw new Error("Nested R2 review exclusion block");
      inBlock = true;
    } else if (/^\s*<!-- R2_REVIEW_ONLY_END -->\s*$/.test(line)) {
      if (!inBlock) throw new Error("Unmatched R2 review exclusion end");
      inBlock = false;
    } else if (!inBlock && !line.includes("R2_REVIEW_ONLY")) {
      output += line;
    } else if (!inBlock && !/\/\/ R2_REVIEW_ONLY\s*$|\/\* R2_REVIEW_ONLY \*\//.test(line)) {
      throw new Error("Unknown R2 review exclusion marker");
    }
  }
  if (inBlock) throw new Error("Unclosed R2 review exclusion block");
  return output;
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
