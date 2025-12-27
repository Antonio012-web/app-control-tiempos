module.exports = function(api) {
    api.cache(true);
    return {
      presets: [
        'babel-preset-expo',
        '@babel/preset-flow'
      ],
      plugins: [
        // aquí puedes añadir otros plugins si los necesitas
      ]
    };
  };
  