// ─── ESTADO DO GATO (em memória, sincroniza com o app) ───
let catState = {
  name: "Bartolomeu",
  color: "#3a3a4a",
  colorIdx: 2,
  happiness: 80,
  energy: 70,
  mood: "idle",
  lastFed: Date.now(),
  lastPet: Date.now(),
};

// Fila de ações pendentes do Discord → App
const pendingActions = [];

function getCatState() {
  return catState;
}

function updateCatState(updates) {
  catState = { ...catState, ...updates };
  return catState;
}

function addPendingAction(action) {
  pendingActions.push(action);
}

function flushPendingActions() {
  const actions = [...pendingActions];
  pendingActions.length = 0;
  return actions;
}

module.exports = {
  getCatState,
  updateCatState,
  addPendingAction,
  flushPendingActions,
};
