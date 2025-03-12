# Task Parser

Task Parser is a lightweight utility to manage todos, tasks and projects in Markdown using VSCode.
This extension is a heavily rewritten and simplified fork of [Proletarian Wizard](https://github.com/cfe84/proletarian-wizard) VSCode extension. This extension is also inspired by the excellent [Things](https://culturedcode.com/things/) by Cultured Code.

## Features

TODO
Add screenshots

## Design Principles

Task Parser is designed to be:

- **Integrated**. The extension leverages as many VSCode capabilities as possible, including tree views, command palette and quick pick functionality. Since tasks are defined as plaintext, a lot of extra functionality such as search, version control or complex edits are provided by VSCode by default.
- **Minimal**. Due to these deep integrations, the extension provides only a small amount of extra commands for task management.
- **Opinionated**. There are no configuration options, but a one-size-fits all workflow that accomodates a lot of different use cases.

## Setup

1. Create a new directory which will contain your projects and tasks.
2. (Optional) Initialize a git repository in your new directory to keep your projects under version control.
3. Inside this base directory, create the `Active`, `Archive` and `Someday` directories and an empty `Inbox.md` file.
4. Set the VSCode configuration variable `task-parser.baseDir` to this directory.

## Usage

### Task Definition

The core of Task Parser is a markdown parsing tool that will scan all the files present in the `Active` and `Someday` directories as well as `Inbox.md` for tasks. The structure of a task follows a simple syntax:

```
- [{ ,x}] (YYYY-MM-DD) Task Title (@wait)
```

- A task is always defined by a dash `-` followed by a *checkbox* `[ ] `.
- A task is either *pending* (`[ ]`) or *done* (`[x]`). Only to do tasks are parsed by task parser.
- A task have optional due date in `YYYY-MM-DD` format after its checkbox.
- A task can be marked as on hold using the `@wait` tag.

Any text in Markdown documents not starting with `- [ ]` will automatically be skipped by Task Parser, which allows to freely add descriptions, diagrams or images to projects managed by Task Parser.

### Project Example

```md
# Example Project

This is a sample project illustrating the syntax of Task Parser.

- [x] Task #1 - A completed task with no due date.

    Text can be added above or below any task and will not be parsed by Task Parser.
    Indentation is not necessary but helps visually.

- [ ] Task #2 - A complex task.

    We have a complex task to deal with. We can split it up into subtasks to track its progress more easily.
    Note that these splits are again visual, there is no hierarchy or dependency between a task and its 
    sub-tasks in Task Parser.

    - [ ] 2025-03-12: Subtask #1 - With due date.

        We start with a first subtask, and assign it a due date.

    - [ ] 2025-03-14: Subtask #2 - With due date and on hold @wait

        If the second subtask is dependent on the completion of the first, we use a `@wait` tag to hide it from
        currently actionable tasks. The tag will take precendence over the task's due date, which is still kept
        for tracking purposes.

    - [ ] Subtask #3

        Let's say you have a third subtask that is independent from the two first. You can get to work on it
        right away, hence no need for a @wait tag.
```


## Commands

### Task-level Commands

You can quickly transform a task into a list item using the command `Task Parser: Toggle Task Checkbox` or by pressing <kbd>⌃</kbd> + <kbd>⌥</kbd> + <kbd>Return</kbd>.

You can quickly toggle the status of a task using the command `Task Parser: Toggle Task Done` or by pressing <kbd>⌃</kbd> + <kbd>⌥</kbd> + <kbd>x</kbd>.

Task Parser provides multiple utilities  You can toggle due dates on a task (defaulting to the current day) using the command `Task Parser: Toggle Task Date` or by pressing <kbd>⌃</kbd> + <kbd>⌥</kbd> + <kbd>d</kbd>. You can also easily mod

FINISH HERE


Task Parser relies on a specific directory structure to work.

New tasks and ideas are added to an `Inbox.md` file using the `tp.addTaskToInbox` command.

## Project Structure

```
task-parser.baseDir
|-- Inbox.md                 // Mandatory project. Contains new project ideas and tasks.
|-- Active                   // Mandatory directory. Contains currently active and actionable projects.
|   |-- Active Project 1.md
|   |-- Active Project 2.md
|   `-- ...
|-- Archive                  // Mandatory directory. Contains completed projects.
|   |-- Archived Project.md
|   `-- ...
|-- Someday            // Mandatory directory. Contains projects not yet completed but not actively being worked on.
    |-- Future Project.md
    `-- ...
```

## Workflow Suggestions

TODO




## Future Work

- [ ] Popup with overdue tasks on startup.
- [ ] Check if we can add extra user options in th quickpick depending on how we want to open the project
- [ ] Add option to open and split if needed
- [ ] Add templating functionality
- [ ] Add a "move to Someday" function
- [ ] Consider dropping the wait tag completely (would entirely get rid of the @ tagging system, nice, by changing the character inside the checkbox. Would make even more sense.)
- [ ] Add a refresh button at the top of the `Task Overview` tree view
- [ ] Add actions on tasks from the Tree view (e.g. toggle done, archive, move)
- [ ] Fix issue when calling toggle task checkbox on a line with no leading `-`
