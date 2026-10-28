module.exports = {
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/generated/**'],
  coverageDirectory: 'coverage',
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  rootDir: '.',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/test/'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          allowSyntheticDefaultImports: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true,
          experimentalDecorators: true,
          isolatedModules: true,
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          target: 'ES2022',
          types: ['jest', 'node'],
        },
        useESM: true,
      },
    ],
  },
};
