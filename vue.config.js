const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: (config) => {
    // Production build'de tüm console.* ve debugger çağrılarını bundle'dan kaldır.
    // Kaynak kod değişmez; geliştirmede (npm run serve) loglar görünmeye devam eder.
    if (process.env.NODE_ENV === 'production') {
      config.optimization.minimizer('terser').tap((args) => {
        args[0].terserOptions.compress = {
          ...args[0].terserOptions.compress,
          drop_console: true,
          drop_debugger: true
        }
        return args
      })
    }
  }
})
