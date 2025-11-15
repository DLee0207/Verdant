// In-memory data store
export const dataStore = {
  units: [],
  tenants: [],
  readings: []
};

// Helper functions to mimic MongoDB queries (optimized for speed)
export const Unit = {
  find: (query = {}) => {
    // FAST MODE: Synchronous operation
    let results = dataStore.units;
    
    if (query.buildingId) {
      results = results.filter(u => u.buildingId === query.buildingId);
    }
    
    return Promise.resolve(results);
  },
  
  findOne: (query) => {
    // FAST MODE: Synchronous operation
    if (query.id) {
      const result = dataStore.units.find(u => u.id === query.id);
      return Promise.resolve(result || null);
    }
    return Promise.resolve(null);
  },
  
  deleteMany: () => {
    dataStore.units = [];
    return Promise.resolve({ deletedCount: 0 });
  },
  
  countDocuments: () => {
    return Promise.resolve(dataStore.units.length);
  }
};

export const Tenant = {
  find: (query = {}) => {
    // FAST MODE: Synchronous operation
    let results = dataStore.tenants;
    
    if (query.unitId) {
      if (query.unitId.$in) {
        results = results.filter(t => query.unitId.$in.includes(t.unitId));
      } else {
        results = results.filter(t => t.unitId === query.unitId);
      }
    }
    
    return Promise.resolve(results);
  },
  
  findOne: (query) => {
    // FAST MODE: Synchronous operation
    if (query.id) {
      const result = dataStore.tenants.find(t => t.id === query.id);
      return Promise.resolve(result || null);
    }
    if (query.unitId) {
      const result = dataStore.tenants.find(t => t.unitId === query.unitId);
      return Promise.resolve(result || null);
    }
    return Promise.resolve(null);
  },
  
  deleteMany: () => {
    dataStore.tenants = [];
    return Promise.resolve({ deletedCount: 0 });
  }
};

export const Reading = {
  find: (query = {}) => {
    // FAST MODE: Synchronous operation (though we don't use readings in fast mode)
    let results = dataStore.readings;
    
    if (query.unitId) {
      if (query.unitId.$in) {
        results = results.filter(r => query.unitId.$in.includes(r.unitId));
      } else {
        results = results.filter(r => r.unitId === query.unitId);
      }
    }
    
    if (query.date && query.date.$gte) {
      results = results.filter(r => new Date(r.date) >= query.date.$gte);
    }
    
    return Promise.resolve(results);
  },
  
  deleteMany: () => {
    dataStore.readings = [];
    return Promise.resolve({ deletedCount: 0 });
  }
};

