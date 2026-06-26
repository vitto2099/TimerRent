const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.timerrent');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadLocalData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error loading data', e);
      return {};
    }
  }
  return {};
}

function saveLocalData(dataObj) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataObj, null, 2));
  } catch (e) {
    console.error('Error saving data', e);
  }
}

// Helpers for Cloud Data
function getUid() {
  if (window.FirebaseApp && window.FirebaseApp.auth && window.FirebaseApp.auth.currentUser) {
    return window.FirebaseApp.auth.currentUser.uid;
  }
  return null;
}

async function getCloudDoc() {
  const uid = getUid();
  if (!uid) throw new Error("Usuário não autenticado na nuvem.");
  const { db } = window.FirebaseApp;
  const { doc, getDoc } = require('firebase/firestore');
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return {};
}

async function setCloudDoc(dataObj) {
  const uid = getUid();
  if (!uid) throw new Error("Usuário não autenticado na nuvem.");
  const { db } = window.FirebaseApp;
  const { doc, setDoc } = require('firebase/firestore');
  const docRef = doc(db, "users", uid);
  await setDoc(docRef, dataObj, { merge: true });
}

let storageMode = 'LOCAL';

const StorageUtils = {
  
  setMode: function(mode) {
    storageMode = mode;
  },
  
  getMode: function() {
    return storageMode;
  },

  // ===== DATA ABSTRACTION =====
  _getData: async function() {
    if (storageMode === 'CLOUD') {
      return await getCloudDoc();
    } else {
      return loadLocalData();
    }
  },
  
  _saveData: async function(updates) {
    if (storageMode === 'CLOUD') {
      await setCloudDoc(updates);
    } else {
      const data = loadLocalData();
      saveLocalData({ ...data, ...updates });
    }
  },

  // ===== CONFIG =====
  saveConfig: async function(config) {
    await this._saveData({ config });
  },
  loadConfig: async function() {
    const data = await this._getData();
    const configData = data.config;
    const defaultConfig = {
      name: 'Desenvolvedor',
      currency: 'R$',
      hourlyRate: 50,
      hoursPerMonth: 160,
      profitMargin: 30,
      expenses: [
        { id: '1', name: 'Moradia', value: 0 },
        { id: '2', name: 'Alimentação', value: 0 },
        { id: '3', name: 'Transporte', value: 0 },
        { id: '4', name: 'Assinaturas', value: 0 },
        { id: '5', name: 'Equipamento', value: 0 },
        { id: '6', name: 'Outros', value: 0 }
      ]
    };
    if (configData) {
      const config = { ...defaultConfig, ...configData };
      if (configData.expenses && !Array.isArray(configData.expenses)) {
        config.expenses = defaultConfig.expenses; // fallback
      }
      return config;
    }
    return defaultConfig;
  },

  // ===== RULES =====
  saveRules: async function(rules) {
    await this._saveData({ rules });
  },
  loadRules: async function() {
    const data = await this._getData();
    return data.rules || null;
  },

  // ===== PROJECTS =====
  saveProject: async function(project) {
    const data = await this._getData();
    const projects = data.projects || [];
    
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = project;
    } else {
      projects.push(project);
    }
    
    await this._saveData({ projects });
  },
  listProjects: async function() {
    const data = await this._getData();
    return data.projects || [];
  },
  deleteProject: async function(id) {
    const data = await this._getData();
    let projects = data.projects || [];
    projects = projects.filter(p => p.id !== id);
    await this._saveData({ projects });
  },
  clearProjects: async function() {
    await this._saveData({ projects: [] });
  }
};

if (typeof window !== 'undefined') {
  window.StorageUtils = StorageUtils;
}
