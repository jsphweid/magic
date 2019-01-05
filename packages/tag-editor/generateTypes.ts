import { apiUrl, authHeader } from "./src/data";

function executeBashCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(command, (err: any, stdout: any, stderr: any) => {
      if (err) {
        reject(stderr);
      } else {
        console.log(stdout);
        resolve();
      }
    });
  });
}

const pathAdjustment = `./packages/tag-editor`;

const removeOldTypesCommand = `rm -rf ${pathAdjustment}/__generatedTypes__`;
const codegenCommand = `
apollo codegen:generate ${pathAdjustment}/__generatedTypes__.ts --outputFlat \
    --queries=${pathAdjustment}/src/graphql/queries/**/*.ts \
    --endpoint=${apiUrl} \
    --header="Authorization: ${authHeader}" \
    --target=typescript
`;

const { exec } = require("child_process");

executeBashCommand(removeOldTypesCommand).then(() =>
  executeBashCommand(codegenCommand)
);
