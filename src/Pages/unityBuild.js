// Fichiers d'un build Unity WebGL situé dans public/<dir>/Build/<name>.*
export const unityBuild = (dir, name = dir) => ({
  loaderUrl: `/${dir}/Build/${name}.loader.js`,
  dataUrl: `/${dir}/Build/${name}.data`,
  frameworkUrl: `/${dir}/Build/${name}.framework.js`,
  codeUrl: `/${dir}/Build/${name}.wasm`,
});
