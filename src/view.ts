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
        this.description = todo.file
    }
}

class CollapsibleTreeItem extends vscode.TreeItem {
    constructor(name: string, private todoItems: todo.TodoItem[], viewType: todo.TodoView) {
        super(name)
        this.collapsibleState =
            viewType == todo.TodoView.Anytime
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.Collapsed
    }

    todosAsTreeItems = () => this.todoItems.map((todo) => new TodoTreeItem(todo))
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

    getTreeItem(element: TodoTreeItem | CollapsibleTreeItem): TodoTreeItem {
        return element
    }

    async getChildren(
        element?: TodoTreeItem | CollapsibleTreeItem | undefined
    ): Promise<TodoTreeItem[] | CollapsibleTreeItem[]> {
        if (element) {
            if (element instanceof CollapsibleTreeItem) {
                return element.todosAsTreeItems()
            }
            return []
        }

        const todos = main.Todos.get(this.type)

        // Anytime and Someday are grouped by project
        if (this.type === todo.TodoView.Anytime || this.type === todo.TodoView.Someday) {
            const projects = Array.from(new Set(todos.map((todo) => todo.file)))
            return projects.map(
                (project) =>
                    new CollapsibleTreeItem(
                        project,
                        todos.filter((todo) => todo.file === project),
                        this.type
                    )
            )
        }

        // Scheduled is grouped by date
        if (this.type === todo.TodoView.Scheduled) {
            const dates = Array.from(new Set(todos.map((todo) => todo.date))).sort((a, b) => (a > b ? 1 : -1))
            return dates.map(
                (date) =>
                    new CollapsibleTreeItem(
                        util.getDateDescription(date),
                        todos.filter((todo) => todo.date === date),
                        this.type
                    )
            )
        }

        // Today and Inbox are not grouped
        return todos.map((todo) => {
            return new TodoTreeItem(todo)
        })
    }
}
