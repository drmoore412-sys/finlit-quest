(function(root){
  "use strict";
  // Licensed soundtrack integration point. Keep this empty until the owner has
  // purchased and added the final audio file. FinLitAudio uses its original
  // synthesized loop while empty, then automatically prefers this seamless
  // loop without requiring changes to gameplay or the audio engine.
  root.FINLIT_AUDIO_CONFIG=Object.freeze({
    musicTrackUrl:"",
  });
})(typeof globalThis!=="undefined"?globalThis:this);
