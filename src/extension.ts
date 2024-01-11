import * as vscode from "vscode";
import * as view from "./view";
import * as func from "./func"
import * as todo from './todos'

export let Todos : todo.TodoGroup;
export let Views : view.ExtensionViews;
export let Funcs : func.ExtensionCommands;


export function refresh() {
  Todos.refresh();
  Views.refresh();
}

export function activate(vscontext: vscode.ExtensionContext) {

  Todos = new todo.TodoGroup([]);
  Todos.refresh();
  
  vscontext.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(() => refresh()),
    vscode.workspace.onDidRenameFiles(() => refresh()),
    vscode.workspace.onDidCreateFiles(() => refresh()),
    vscode.workspace.onDidDeleteFiles(() => refresh())
    );
    
  Funcs = new func.ExtensionCommands(vscontext);
  Views = new view.ExtensionViews();
  
}

export function deactivate() { }
