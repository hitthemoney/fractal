window.hexToRGB = h => JSON.parse(h.replace(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/, (a, r, g, b) => JSON.stringify([parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)]))) // hex to rgb

window.glColor = c => c.map(x => x / 255);

window.$ = s => document.querySelector(s); 

window.w = callback => setTimeout(callback, 0);