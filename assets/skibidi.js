const terminal = document.getElementById("terminal-text");
const auraButton = document.getElementById("aura-button");
const maxWarning = document.getElementById("max-warning");
const maxWarningText = document.getElementById("max-warning-text");

const lines = [
  "sky> boot skibidi",
  "[ok] cringe shield online",
  "[ok] zebramelon driver loaded",
  "[ok] pineapple orangutan runtime mounted",
  "[warn] fanum tax detected in /sys/snacks",
  "[ok] sigma scheduler holding 999 aura",
  "[ok] gyatt gui compositor is violently vibing",
  "sky> status",
  "aura: maximum",
  "rizz: unstable but powerful",
  "dignity: temporarily suspended",
  "result: forbidden route unlocked 🥀"
];

let i = 0;
let text = "";

function typeLine() {
  if (!terminal || i >= lines.length) return;
  text += lines[i] + "\n";
  terminal.textContent = text;
  i++;
  setTimeout(typeLine, 420);
}

setTimeout(typeLine, 4800);

auraButton?.addEventListener("click", () => {
  document.body.classList.add("aura-burst");
  showToast("AURA FARMED +999 • chat is this a kernel buff?");
  setTimeout(() => document.body.classList.remove("aura-burst"), 1300);
});

function showToast(message) {
  const old = document.querySelector(".feed-toast");
  old?.remove();
  const burst = document.createElement("div");
  burst.className = "feed-toast";
  burst.textContent = message;
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1600);
}

function spawnRotEmoji() {
  const emojis = ["🥀", "💀", "🚽", "🧃", "🦓", "🍉", "🍍", "🦧", "✨", "🌀"];
  const el = document.createElement("span");
  el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  Object.assign(el.style, {
    position: "fixed",
    left: Math.random() * 100 + "vw",
    top: "105vh",
    zIndex: "4",
    pointerEvents: "none",
    fontSize: 22 + Math.random() * 32 + "px",
    filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.35))",
    animation: `emojiRise ${5 + Math.random() * 4}s linear forwards`
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 9000);
}

const style = document.createElement("style");
style.textContent = `
@keyframes emojiRise {
  from { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  to { transform: translateY(-125vh) rotate(360deg); opacity: 0; }
}
.aura-burst .hero-content h1 {
  text-shadow: 0 0 38px rgba(183,255,93,0.7), 0 0 80px rgba(255,78,216,0.35);
}
`;
document.head.appendChild(style);

setInterval(spawnRotEmoji, 650);

const feedCounts = new WeakMap();
let maxSequenceRunning = false;

const maxDescriptions = {
  "zebramelon": "Zebramelon has consumed five forbidden melon crumbs and achieved terminal yap velocity. The zebra stripes are buffering, the watermelon core is screaming, and the entire viewport has been fanum taxed into Ohio-level rizz collapse.",
  "pineapple orangutan": "Pineapple Orangutan has eaten five premium aura snacks and unlocked jungle sigma overdrive. The fruit armor is crunchy, the orangutan runtime is bonking reality, and your screen is now legally classified as a snack."
};

function spawnFeedSparks(x, y, emoji) {
  for (let n = 0; n < 8; n++) {
    const spark = document.createElement("span");
    spark.className = "feed-spark";
    spark.textContent = [emoji, "✨", "💀", "🥀", "🧃"][Math.floor(Math.random() * 5)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 120;
    spark.style.left = x + "px";
    spark.style.top = y + "px";
    spark.style.setProperty("--spark-x", Math.cos(angle) * dist + "px");
    spark.style.setProperty("--spark-y", Math.sin(angle) * dist + "px");
    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 1000);
  }
}

function resetFeedables() {
  document.querySelectorAll(".feedable").forEach((img) => {
    feedCounts.set(img, 0);
    img.style.setProperty("--feed-scale", "1");
    img.classList.remove("screen-eater", "fed-pulse");
  });
  maxWarning?.classList.remove("show");
  maxWarning?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("rot-max");
  maxSequenceRunning = false;
}

function triggerMaxBrainrot(img) {
  if (maxSequenceRunning) return;
  maxSequenceRunning = true;
  const name = img.dataset.rotname || "unknown creature";
  const desc = maxDescriptions[name] || "The creature reached maximum brainrot and tried to eat the source code. The page is rebooting before the cringe becomes sentient.";

  maxWarningText.textContent = desc;
  maxWarning?.classList.add("show");
  maxWarning?.setAttribute("aria-hidden", "false");
  document.body.classList.add("rot-max");
  img.classList.add("screen-eater");

  showToast(`${name.toUpperCase()} HAS GONE FULL CRINGE KAIJU MODE`);
  setTimeout(resetFeedables, 4000);
}

function feedCreature(img, event) {
  if (maxSequenceRunning) return;

  const name = img.dataset.rotname || "brainrot creature";
  const emoji = img.dataset.emoji || "🍽️";
  const next = Math.min((feedCounts.get(img) || 0) + 1, 5);

  feedCounts.set(img, next);
  img.style.setProperty("--feed-scale", String(1 + next * 0.13));
  img.classList.remove("fed-pulse");
  void img.offsetWidth;
  img.classList.add("fed-pulse");

  const x = event?.clientX ?? window.innerWidth / 2;
  const y = event?.clientY ?? window.innerHeight / 2;
  showToast(`you fed ${name} ${emoji} • brainrot mass ${next}/5`);
  spawnFeedSparks(x, y, emoji);

  if (next >= 5) {
    setTimeout(() => triggerMaxBrainrot(img), 360);
  }
}

document.querySelectorAll(".feedable").forEach((img) => {
  feedCounts.set(img, 0);

  // Stop the browser from treating the picture like a draggable image.
  img.draggable = false;
  img.addEventListener("dragstart", (event) => event.preventDefault());
  img.addEventListener("selectstart", (event) => event.preventDefault());

  // Pointer events work better than plain click on desktop + mobile.
  img.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    img.setPointerCapture?.(event.pointerId);
    feedCreature(img, event);
  });

  // Keyboard support, because why not let the rot be accessible.
  img.setAttribute("tabindex", "0");
  img.setAttribute("role", "button");
  img.setAttribute("aria-label", `Feed ${img.dataset.rotname || "brainrot creature"}`);
  img.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      feedCreature(img, null);
    }
  });
});
