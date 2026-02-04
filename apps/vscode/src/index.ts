import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // 1. 语言支持
  //   vscode.languages.registerDocumentSymbolProvider(
  //     { language: 'mir' },
  //     new MIRDocumentSymbolProvider()
  //   )

  // 2. 命令
  vscode.commands.registerCommand('mdr.previewMIR', () => {
    vscode.window.showInformationMessage('MIR Preview 已连接');
  });

  // 3. 调试适配器（稍后实现）
  //   const factory = new MIRDebugAdapterDescriptorFactory()
  //   vscode.debug.registerDebugAdapterDescriptorFactory('mdr', factory)
}

export function deactivate() {}
