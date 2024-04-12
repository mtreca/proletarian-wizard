import * as vscode from "vscode"
import * as todo from "./todos"
import * as util from "./util"
import * as main from "./extension"

export class ExtensionViews {
    private todayView = new TodoTreeView(todo.TodoView.Today)
    private inboxView = new TodoTreeView(todo.TodoView.Inbox)
    private anytimeView = new TodoTreeView(todo.TodoView.Anytime)
    private scheduledView = new TodoTreeView(todo.TodoView.Scheduled)
    private somedayView = new TodoTreeView(todo.TodoView.Someday)

    constructor() {
        vscode.window.registerTreeDataProvider("tp.todayView", this.todayView)
        vscode.window.registerTreeDataProvider("tp.inboxView", this.inboxView)
        vscode.window.registerTreeDataProvider("tp.anytimeView", this.anytimeView)
        vscode.window.registerTreeDataProvider("tp.scheduledView", this.scheduledView)
        vscode.window.registerTreeDataProvider("tp.somedayView", this.somedayView)
    }

    refresh() {
        this.todayView.refresh()
        this.inboxView.refresh()
        this.anytimeView.refresh()
        this.scheduledView.refresh()
        this.somedayView.refresh()
    }
}

class TodoTreeItem extends vscode.TreeItem {
    constructor(todo: todo.TodoItem) {
        const prefix = util.isOverdue(todo.date) ? "⚑ " : ""
        super(`${prefix}${todo.text}`)
        this.command = {
            title: "Open",
            command: "tp.openFile",
            arguments: [vscode.Uri.file(todo.path), todo.line],
        }
        // TODO Change this value depending on the task
        this.description = todo.file
    }
}

class ProjectTreeItem extends vscode.TreeItem {
    constructor(name: string, private projectTodos: todo.TodoItem[], viewType: todo.TodoView) {
        super(name)
        this.collapsibleState =
            viewType == todo.TodoView.Anytime
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.Collapsed
    }

    todosAsTreeItems = () => this.projectTodos.map((todo) => new TodoTreeItem(todo))
}

export class TodoTreeView implements vscode.TreeDataProvider<TodoTreeItem> {
    constructor(private type: todo.TodoView) {
        this.type = type
    }

    private onDidChangeTreeDataEventEmitter: vscode.EventEmitter<TodoTreeItem | undefined> = new vscode.EventEmitter<
        TodoTreeItem | undefined
    >()

    readonly onDidChangeTreeData: vscode.Event<TodoTreeItem | undefined> = this.onDidChangeTreeDataEventEmitter.event

    refresh(): void {
        this.onDidChangeTreeDataEventEmitter.fire(undefined)
    }

    getTreeItem(element: TodoTreeItem | ProjectTreeItem): TodoTreeItem {
        return element
    }

    async getChildren(
        element?: TodoTreeItem | ProjectTreeItem | undefined
    ): Promise<TodoTreeItem[] | ProjectTreeItem[]> {
        if (element) {
            if (element instanceof ProjectTreeItem) {
                return element.todosAsTreeItems()
            }
            return []
        }

        const todos = main.Todos.get(this.type)
        if (this.type === todo.TodoView.Inbox || this.type === todo.TodoView.Today)
            return todos.map((todo) => {
                return new TodoTreeItem(todo)
            })

        const projects = Array.from(new Set(todos.map((todo) => todo.file)))
        return projects.map(
            (project) =>
                new ProjectTreeItem(
                    project,
                    todos.filter((todo) => todo.file === project),
                    this.type
                )
        )
    }
}
