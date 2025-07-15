const mapTilerService = {
  apiKey: '9VwMyrJdecjrEB6fwLGJ',
  
  getStyleUrl: (style = 'satellite') => {
    return `https://api.maptiler.com/maps/${style}/style.json?key=${mapTilerService.apiKey}`;
  },
  
  getTileUrl: (style = 'satellite') => {
    return `https://api.maptiler.com/tiles/${style}/{z}/{x}/{y}.jpg?key=${mapTilerService.apiKey}`;
  }
};

export default mapTilerService;