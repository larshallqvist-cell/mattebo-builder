/**
 * Touch controls for uploaded HTML slideshows. iPads have no keyboard, and
 * iOS does not send taps on plain slide areas to the deck's document click
 * handler, so we inject a close button and a "next slide" button into the
 * sandboxed deck. "Next" fires the same ArrowRight key event the decks
 * already listen for; "close" asks the Mattebo tab (the parent) to close.
 */
export const PRESENTATION_CLOSE_MESSAGE = "mattebo-presentation-close";

const MARKER = "data-mattebo-controls";

const CONTROLS = `
<div ${MARKER} style="all:initial">
<style>
.mattebo-ctl{position:fixed;z-index:2147483647;display:flex;align-items:center;justify-content:center;
  border:0;border-radius:9999px;background:rgba(12,35,64,.55);color:#fff;cursor:pointer;
  font:600 30px/1 system-ui,-apple-system,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);
  -webkit-tap-highlight-color:transparent;touch-action:manipulation;opacity:.7;transition:opacity .2s,transform .1s}
.mattebo-ctl:hover,.mattebo-ctl:focus-visible{opacity:1}
.mattebo-ctl:active{transform:scale(.92)}
.mattebo-close{top:14px;right:14px;width:48px;height:48px;font-size:24px}
.mattebo-next{bottom:18px;right:18px;width:72px;height:72px;font-size:40px}
@media print{.mattebo-ctl{display:none}}
</style>
<button type="button" class="mattebo-ctl mattebo-close" aria-label="Stäng presentationen" title="Stäng">✕</button>
<button type="button" class="mattebo-ctl mattebo-next" aria-label="Nästa bild" title="Nästa bild">›</button>
<script>
(function(){
  var root=document.currentScript.parentNode;
  // iPad Safari has no requestFullscreen; decks call it on the first step and would crash.
  var E=Element.prototype;
  if(typeof E.requestFullscreen!=="function"){
    E.requestFullscreen=function(){
      try{ if(typeof this.webkitRequestFullscreen==="function") this.webkitRequestFullscreen(); }catch(e){}
      return Promise.resolve();
    };
  }
  function key(){
    var o={key:"ArrowRight",code:"ArrowRight",keyCode:39,which:39,bubbles:true,cancelable:true};
    (document.activeElement&&document.activeElement!==document.body?document.activeElement:document).dispatchEvent(new KeyboardEvent("keydown",o));
    document.dispatchEvent(new KeyboardEvent("keyup",o));
  }
  function guard(e){e.stopPropagation();}
  ["pointerdown","pointerup","mousedown","mouseup","touchstart","touchend"].forEach(function(t){root.addEventListener(t,guard);});
  root.querySelector(".mattebo-next").addEventListener("click",function(e){e.preventDefault();e.stopPropagation();this.blur();key();});
  root.querySelector(".mattebo-close").addEventListener("click",function(e){e.preventDefault();e.stopPropagation();parent.postMessage("${PRESENTATION_CLOSE_MESSAGE}","*");});
})();
</script>
</div>`;

/** Adds the close and next buttons to a slideshow's HTML (once). */
export const withTouchControls = (html: string): string => {
  if (html.includes(MARKER)) return html;
  const at = html.toLowerCase().lastIndexOf("</body>");
  return at === -1 ? html + CONTROLS : html.slice(0, at) + CONTROLS + html.slice(at);
};
