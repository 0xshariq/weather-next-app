module.exports = {
    images: {
      domains: ['images.unsplash.com','cdn.weatherapi.com','images.pexels.com'],
    },
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.optimization.splitChunks.maxSize = 25000000;
      }
      return config;
    },
  }
  