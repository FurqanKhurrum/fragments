const data = {};

module.exports = {
  writeFragment(ownerId, id, fragment) {
    data[ownerId] = data[ownerId] || {};
    
    // If there's existing data, preserve it
    const existingData = data[ownerId][id]?.data;
    
    // Save the fragment
    data[ownerId][id] = fragment;
    
    // Restore the data if it existed
    if (existingData !== undefined) {
      data[ownerId][id].data = existingData;
    }
  },

  readFragment(ownerId, id) {
    return data[ownerId]?.[id] || null;
  },

  writeFragmentData(ownerId, id, value) {
    console.log('💾 writeFragmentData called with:', ownerId, id, value);
    
    // Ensure the owner exists
    data[ownerId] = data[ownerId] || {};
    
    // Ensure the fragment exists (create minimal structure if needed)
    if (!data[ownerId][id]) {
      data[ownerId][id] = {};
    }
    
    // Store the actual data
    data[ownerId][id].data = value;
    
    console.log('💾 Data stored. Current data structure:', data[ownerId]?.[id]);
  },

  readFragmentData(ownerId, id) {
    console.log('📖 readFragmentData called with:', ownerId, id);
    const result = data[ownerId]?.[id]?.data || null;
    console.log('📖 Found data:', result);
    return result;
  },

  listFragments(ownerId) {
    return Object.values(data[ownerId] || {});
  },

  deleteFragment(ownerId, id) {
    delete data[ownerId]?.[id];
  }
};
