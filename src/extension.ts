// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { translate, Configuration } from 'auto-translate-json-library';
const NAME = 'AutoTranslateJSON';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Extension "auto-translate-json" is active');

  vscode.commands.registerCommand(
    'extension.autotranslate',
    async (resource: vscode.Uri) => {
      const googleApiKey = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.googleApiKey') as string;

      const awsAccessKeyId = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.awsAccessKeyId') as string;

      const awsSecretAccessKey = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.awsSecretAccessKey') as string;

      const awsRegion = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.awsRegion') as string;

      const azureSecretKey = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.azureSecretKey') as string;

      const deepLProSecretKey = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.deepLProSecretKey') as string;

      const deepLFreeSecretKey = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.deepLFreeSecretKey') as string;

      const azureRegion = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.azureRegion') as string;

      const openAIKey = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.openAIKey') as string;

      if (
        !googleApiKey &&
        !awsAccessKeyId &&
        !awsSecretAccessKey &&
        !awsRegion &&
        !azureSecretKey &&
        !azureRegion &&
        !deepLProSecretKey &&
        !deepLFreeSecretKey &&
        !openAIKey
      ) {
        showWarning(
          'You must provide a Google, AWS, Azure, DeepL or OpenAI parameters first in the extension settings.'
        );

        return;
      }

      let config: Configuration = {} as Configuration;

      // set the delimiters for named arguments
      const startDelimiter = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.startDelimiter') as string;

      if (startDelimiter) {
        config.startDelimiter = startDelimiter;
      }

      const endDelimiter = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.endDelimiter') as string;

      if (endDelimiter) {
        config.endDelimiter = endDelimiter;
      }

      const ignorePrefix = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.ignorePrefix') as string;

      config.ignorePrefix = '';

      if (ignorePrefix) {
        config.ignorePrefix = ignorePrefix.trim();
      }


      if (googleApiKey) {
        config.translationKeyInfo = {
          kind: 'google',
          apiKey: googleApiKey
        };
      } else if (awsAccessKeyId && awsSecretAccessKey && awsRegion) {
        config.translationKeyInfo = {
          kind: 'aws',
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
          region: awsRegion
        };
      } else if (azureSecretKey && azureRegion) {
        config.translationKeyInfo = {
          kind: 'azure',
          secretKey: azureSecretKey,
          region: azureRegion
        };
      } else if (deepLFreeSecretKey) {
        config.translationKeyInfo = {
          kind: 'deepLFree',
          secretKey: deepLFreeSecretKey
        };
      } else if (deepLProSecretKey) {
        config.translationKeyInfo = {
          kind: 'deepLPro',
          secretKey: deepLProSecretKey
        };
      } else if (openAIKey) {
        config.translationKeyInfo = {
          kind: 'openai',
          apiKey: openAIKey
        };
      } else {
        showWarning(
          'You must provide a Google, AWS, Azure, DeepL or OpenAI parameters first in the extension settings.'
        );
        return;
      }

      // inform user if running the extension from the command bar
      if (resource === undefined) {
        showMessage(
          'You must run this extension by right clicking on a .json file',
          ''
        );
        return;
      }

      const fileMode =
        (vscode.workspace.getConfiguration().get('auto-translate-json.mode') as
          | 'file'
          | 'folder') ?? 'file';

      config.mode = fileMode;

      config.sourceLocale = vscode.workspace
        .getConfiguration()
        .get('auto-translate-json.sourceLocale') as string;

      // ask user to pick options
      const keepTranslations = await askToPreserveTranslations();
      if (keepTranslations === null) {
        showWarning('You must select a translations option');
        return;
      }
      if (keepTranslations) {
        config.keepTranslations = 'keep';
      } else {
        config.keepTranslations = 'retranslate';
      }
      const keepExtras = await askToKeepExtra();
      if (keepExtras === null) {
        showWarning('You must select a keep option');
        return;
      }
      if (keepExtras) {
        config.keepExtraTranslations = 'keep';
      } else {
        config.keepExtraTranslations = 'remove';
      }
      await translate(resource.fsPath, config);

      showMessage('Translations have been added to the file', '');
    }
  );
}

function showError(error: Error, prefix: string = '') {
  let message = error.toString();
  if (error.message) {
    message = NAME + ': ' + prefix + error.message;
  } else {
    message = NAME + ': ' + prefix + message;
  }
  console.error(message);
  vscode.window.showErrorMessage(message);
}

function showWarning(message: string, prefix: string = '') {
  message = NAME + ': ' + prefix + message;
  console.log(message);
  vscode.window.showWarningMessage(message);
}

function showMessage(message: string, prefix: string = '') {
  message = NAME + ': ' + prefix + message;
  console.log(message);
  vscode.window.showInformationMessage(message);
}

async function askToPreserveTranslations(): Promise<boolean | null> {
  let keepTranslations: boolean | null = null;
  const optionKeep = 'Preserve previous translations (default)';
  const optionReplace = 'Retranslate previous translations';
  await vscode.window
    .showQuickPick([optionKeep, optionReplace])
    .then((selection) => {
      if (selection === optionReplace) {
        keepTranslations = false;
      }
      if (selection === optionKeep) {
        keepTranslations = true;
      }
    });
  return keepTranslations;
}

async function askToKeepExtra(): Promise<boolean | null> {
  let keepExtra: boolean | null = null;
  const optionKeep = 'Keep extra translations (default)';
  const optionReplace = 'Remove extra translations';
  await vscode.window
    .showQuickPick([optionKeep, optionReplace])
    .then((selection) => {
      if (selection === optionReplace) {
        keepExtra = false;
      }
      if (selection === optionKeep) {
        keepExtra = true;
      }
    });
  return keepExtra;
}
// this method is called when your extension is deactivated
export function deactivate() { }
