import { createTestProject, runNxCommand} from '@nxrocks/common/testing';
import { execSync, ExecSyncOptions } from 'child_process';
import { rmSync } from 'fs-extra';

process.env.NODE_OPTIONS="--max-old-space-size=8192"; // to avoid oom error during the tests

let projectDirectory: string;

const execSyncOptions: (cwd?:string) => ExecSyncOptions = (cwd:string = projectDirectory) => ({
  cwd: cwd,
  env: {
    ...process.env,
    GIT_COMMITTER_NAME: 'Smoke Test CI',
    GIT_COMMITTER_EMAIL: 'no-reply@fake.com',
    GIT_AUTHOR_NAME: 'Smoke Test CI',
    GIT_AUTHOR_EMAIL: 'no-reply@fake.com',
  },
  stdio: 'inherit',
});

const bootapp = 'bootapp';
const bootlib = 'bootlib';
const quarkusapp = 'quarkusapp';
const quarkuslib = 'quarkuslib';
const flutterapp = 'flutterapp';
const flutterlib = 'flutterlib';
const mnApp = 'mnapp';
const krApp = 'krapp';

describe('nxrocks smoke tests', () => {

  afterEach(async () => {
    if(!process.env.KEEP_SMOKE_TESTS_DIR) {
      // Cleanup the test project
      rmSync(projectDirectory, {
        recursive: true,
        force: true,
      });
    }
    else {
      console.warn(`Keeping smoke test directory at '${projectDirectory}'. Do not forget to remove it when done!`);
    }
  });

  it.each`
  pkgManager  | createCommand                               | runCommand     | addCommand     | pluginVersion
  ${'npm'}    | ${'npx --yes create-nx-workspace@latest'}   | ${'npx'}       | ${'npm i'}     | ${'latest'}  
  ${'yarn'}   | ${'yarn create nx-workspace'}               | ${'yarn'}      | ${'yarn add'}  | ${'latest'}  
  ${'pnpm'}   | ${'pnpm dlx create-nx-workspace@latest'}    | ${'pnpm exec'} | ${'pnpm add'}  | ${'latest'}  
  ${'npm'}    | ${'npx --yes create-nx-workspace@latest'}   | ${'npx'}       | ${'npm i'}     | ${'e2e'}     
  ${'yarn'}   | ${'yarn create nx-workspace'}               | ${'yarn'}      | ${'yarn add'}  | ${'e2e'}     
  ${'pnpm'}   | ${'pnpm dlx create-nx-workspace@latest'}    | ${'pnpm exec'} | ${'pnpm add'}  | ${'e2e'}     
`(`should sucessfully run using latest Nx workspace, $pluginVersion plugins version and $pkgManager package manager`, async ({createCommand, runCommand, addCommand, pluginVersion }) => {

    if(!process.env.CI && !process.env.FORCE_SMOKE_TESTS) {
      console.log('Skipping smoke test because not running on CI and FORCE_SMOKE_TESTS is not set');
      return;
    }

    projectDirectory = createTestProject(createCommand, 'nxrocks-smoke');

    execSync('git init', execSyncOptions()); 

    const pluginPkgs = [
      `@nxrocks/nx-spring-boot@${pluginVersion}`,
      `@nxrocks/nx-quarkus@${pluginVersion}`,
      `@nxrocks/nx-micronaut@${pluginVersion}`,
      `@nxrocks/nx-flutter@${pluginVersion}`,
      `@nxrocks/nx-melos@${pluginVersion}`,
      `@nxrocks/nx-ktor@${pluginVersion}`,
    ].join(' ');

    execSync(`${addCommand} ${pluginPkgs}`, execSyncOptions(projectDirectory));

      
    runNxCommand(
      `generate @nxrocks/nx-spring-boot:new ${bootapp} --skip-format=false --projectType application --no-interactive`,
      runCommand,
      execSyncOptions(),
    );
    runNxCommand(
      `generate @nxrocks/nx-spring-boot:new ${bootlib} --skip-format=false --projectType library --no-interactive`,
      runCommand,
      execSyncOptions(),
    );

    runNxCommand(
      `generate @nxrocks/nx-quarkus:new ${quarkusapp} --skip-format=false --projectType application --no-interactive`,
      runCommand,
      execSyncOptions(),
    );
    runNxCommand(
      `generate @nxrocks/nx-quarkus:new ${quarkuslib} --skip-format=false --projectType library --no-interactive`,
      runCommand,
      execSyncOptions(),
    );
    
    runNxCommand(
      `generate @nxrocks/nx-micronaut:new ${mnApp} --skip-format=false --no-interactive`,
      runCommand,
      execSyncOptions(),
    );

    runNxCommand(
      `generate @nxrocks/nx-melos:init --scriptNameSeparator=-`,
      runCommand,
      execSyncOptions(),
    );
    
    runNxCommand(
      `generate @nxrocks/nx-ktor:new ${krApp} --skip-format=false --no-interactive`,
      runCommand,
      execSyncOptions(),
    );

    runNxCommand(
      `generate @nxrocks/nx-flutter:new ${flutterapp} --template app --no-interactive`,
      runCommand,
      execSyncOptions(),
    );
    runNxCommand(
      `generate @nxrocks/nx-flutter:new ${flutterlib} --template plugin --no-interactive`,
      runCommand,
      execSyncOptions(),
    );

    execSync(`git commit -am "chore: scaffold projects"`, execSyncOptions());

    runNxCommand(`clean ${bootapp}`, runCommand, execSyncOptions());
    runNxCommand(`clean ${bootlib}`, runCommand, execSyncOptions());
    runNxCommand(`clean ${quarkusapp}`, runCommand, execSyncOptions());
    runNxCommand(`clean ${quarkuslib}`, runCommand, execSyncOptions());
    runNxCommand(`clean ${mnApp}`, runCommand, execSyncOptions());
    runNxCommand(`melos-bootstrap`, runCommand, execSyncOptions());
    runNxCommand(`clean ${flutterapp}`, runCommand, execSyncOptions());
    runNxCommand(`clean ${flutterlib}`, runCommand, execSyncOptions());
    runNxCommand(`clean ${krApp}`, runCommand, execSyncOptions());


    expect(true).toBeTruthy();
  }, 3600000);

});