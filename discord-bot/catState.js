// ─── ESTADO DO GATO (em memória, sincroniza com o app) ───
let catState = {
  name: "Mimi",
  color: "#9b87f5",
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
