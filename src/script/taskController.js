const MARKDOWN = require('marked');

let taskController = (function () {
    const COLORS = ['#ee5253', '#feca57', '#00d2d3', '#222f3e', '#2e86de', '#ff9f43', '#e1b12c', '#9c88ff', '#0097e6'];
    const COLOR_MAIN = "#70a1ff";
    const PRIORITY_COLORS = ['#ee5253', '#feca57', '#222f3e'];
    let tasks = [];
    let categories = {};

    class Category {
        constructor(color, name) {
            this.color = color;
            this.name = name;
        }
    }

    let idCounter = 0;
    class Task {
        constructor(title, note, dueTime, category, priority) {
            this.id = idCounter++;
            this.title = title;
            this.note = note;
            this.dueTime = dueTime;
            this.category = categories[category.name];
            this.priority = priority;
            this.isDone = false;
            this.isArchived = false;
        }
    }

    function getTaskById(id) {
        for (let i = 0; i < tasks.length; ++i) {
            if (id == tasks[i]['id']) {
                return tasks[i];
            }
        }
    }

    function getTasksByCategory(cat) {
        return tasks.filter((task) => task.category ? task.category.name === cat : false);
    }

    function createTask(data) {
        const {
            title,
            note,
            dueTime,
            category,
            priority
        } = data;

        let i = 0;
        while (i < tasks.length) {
            if (tasks[i].priority > priority) {
                break;
            }

            ++i;
        }

        tasks.splice(i, 0, new Task(title, note, dueTime, category, priority));

        saveToLocalStorage();
    }

    function createCategory(name) {
        categories[name] = new Category(COLORS[(Math.floor(Math.random() * (COLORS.length)))], name);

        saveToLocalStorage();
    }

    function editTask(index, data) {
        const task = getTaskById(index);
        Object.keys(data).forEach((key) => {
            if (key !== 'category') {
                task[key] = data[key];
            } else {
                task[key] = categories[data[key]['name']];
            }
        });

        saveToLocalStorage();
    }

    function getPriorityString(pr) {
        switch (pr) {
            case 1:
                return 'High priority';
            case 2:
                return 'Medium priority';
            case 3:
                return 'Low priority';
            case 4:
                return '';
            default:
                throw new Error('Invalid priority value');
        }
    }

    function createTaskDoms(filter) {
        let untimed = '';
        let today = '';
        let tomorrow = '';
        let nextSevenDays = '';
        let upcomingDays = '';
        let archived = '';

        const dateToday = new Date;
        const msPerDay = 24 * 60 * 60 * 1000;

        deleteOverDueTasks();

        const [currentTime, currentCategory, currentTitleString] = filter.split('&');

        tasks.filter((task) => {
            if (currentCategory === '') {
                return true;
            } else {
                if (task.category && task.category.name === currentCategory) {
                    return true;
                }
            }

            return false;
        }).filter((task) => {
            if (currentTitleString === '') {
                return true;
            } else {
                if (task.title.toLowerCase().indexOf(currentTitleString) !== -1) {
                    return true;
                }
            }

            return false;
        }).forEach((task) => {
            const taskDom = `
                    <li class="main-panel--tasks__item">
						<div class = "main-panel--tasks__item--title" >
							<input type="checkbox" data-postindex="${task.id}" id="task${task.id}" ${task.isDone ? 'checked' : ''}>
							<label class="main-panel--tasks__item--circle" 
							       style="border-color: ${task.category ? task.category.color : COLOR_MAIN}" for="task${task.id}">&nbsp</label>
							<label class="main-panel--tasks__item--text" for="task${task.id}">${task.title}</label>
						</div>
						<div>
                            <span class="main-panel--tasks__item--priority" style="color: ${PRIORITY_COLORS[task.priority - 1]};">${getPriorityString(task.priority)}</span>
                            <span class="main-panel--tasks__item--duetime">${task.dueTime === '' ? '' : 'Due ' + task.dueTime}</span>
                            <div class="main-panel--tasks__item--category">
                                <span style="background-color: ${task.category ? task.category.color : COLOR_MAIN}">&nbsp;</span>
                                <span>${task.category ? task.category.name : 'Uncategorized'}</span>
                            </div>
                            <button class="main-panel--tasks__item--info" data-postindex="${task.id}">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                            </button>
                            <div class="main-panel--tasks__item--dropdown">
                                <button class="main-panel--tasks__item--more" disabled>
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                                </button>
                                <ul class="main-panel--tasks__item--dropdown__list">
                                    <li class="main-panel--tasks__item--dropdown__item">
                                        <button type="button"
                                        class="main-panel--tasks__item--dropdown__edit"
                                        data-postindex = "${task.id}">
                                            <svg class="w-6 h-6"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                            </svg>
                                            Edit
                                        </button>
                                    </li>
                                    <li class="main-panel--tasks__item--dropdown__item">
                                        <button type="button"
                                        class="main-panel--tasks__item--dropdown__archive"
                                        data-postindex="${task.id}">
                                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                                            Archive
                                        </button>
                                    </li>
                                    <li class="main-panel--tasks__item--dropdown__item">
                                        <button type="button" class="main-panel--tasks__item--dropdown__delete" data-postindex="${task.id}">
                                            <svg class="w-6 h-6"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                                </path>
                                            </svg>
                                            Delete
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
					</li>
                `;

            if (task.isArchived) {
                archived += taskDom;
            } else if (task.dueTime) {
                const t = new Date(task.dueTime);

                if ((t - dateToday) / msPerDay <= 0.5) {
                    today += taskDom;
                } else if ((t - dateToday) / msPerDay <= 1) {
                    tomorrow += taskDom;
                } else if ((t - dateToday) / msPerDay <= 8) {
                    nextSevenDays += taskDom;
                } else {
                    upcomingDays += taskDom;
                }
            } else {
                untimed += taskDom;
            }
        });

        switch (currentTime) {
            case 'Today': {
                return {
                    'Today': today,
                }
            }
            case 'Next 7 Days': {
                return {
                    'Next 7 Days': nextSevenDays,
                }
            }
            case 'Archived': {
                return {
                    'Archived': archived,
                }
            }
            default: {
                return {
                    'Today': today,
                    'Tomorrow': tomorrow,
                    'Next 7 days': nextSevenDays,
                    'Upcoming days': upcomingDays,
                    'Untimed': untimed,
                };
            }
        }
    }

    function createCategoryDoms() {
        let domElements = '';

        Object.keys(categories).forEach((category) => {
            domElements += `
                <li class="side-panel--category">
                    <button class="side-panel--category__title" data-filter="${categories[category].name}" data-filtertype="category">
                        <span style="background-color: ${categories[category].color}">&nbsp;</span>
                        ${categories[category].name}
                    </button>
                    <button class="side-panel--category__del" data-category="${categories[category].name}">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </li>
            `;
        });

        return domElements;
    }

    function fillInfoPanelWithData(index, panel) {
        const task = getTaskById(index);
        panel.querySelector('.modal--task__title').innerHTML = task.title;
        panel.querySelector('.modal--task__description').innerHTML = MARKDOWN(task.note);
        panel.querySelector('.modal--task__bar--duetime').innerText = task.dueTime !== '' ? task.dueTime : 'No due time';
        panel.querySelector('.modal--task__bar--category').innerText = task.category ? task.category.name : 'Uncategorized';
    }

    function fillEditPanelWithData(index, panel) {
        const task = getTaskById(index);

        panel.querySelector('#taskTitle').value = task['title'];
        
        if (task['note']) {
            panel.querySelector('#taskNote').value = task['note'];
        }

        if (task['dueTime']) {
            panel.querySelector('#taskTime').value = task['dueTime'];
        }

        if (task['category']) {
            panel.querySelector('#taskCategory').value = task['category']['name'];
        }

        panel.querySelector('#taskPriority').value = task['priority'];
    }

    function changeTaskDoneness(index) {
        const task = getTaskById(index);
        task.isDone = !task.isDone;
        saveToLocalStorage();
        return task.isDone;
    }

    function getUncompletedTasksLength() {
        return tasks.filter((task) => !task.isDone && !task.isArchived).length;
    }

    function getDueTasksCounters() { 
        let counterObj = {
            'today': 0,
            'tomorrow': 0,
            'nextSevenDays': 0,
            'untimed': 0,
            'uncompleted': getUncompletedTasksLength()
        };

        const dateToday = new Date;
        const msPerDay = 24 * 60 * 60 * 1000;

        tasks.filter((task) => !task.isArchived && !task.isDone).forEach((task) => {
            if (task.dueTime) {
                const t = new Date(task.dueTime)

                if ((t - dateToday) / msPerDay <= 0.5) {
                    counterObj.today += 1;
                } else if ((t - dateToday) / msPerDay <= 1) {
                    counterObj.tomorrow += 1;
                } else {
                    counterObj.nextSevenDays += 1;
                }
            } else {
                counterObj.untimed += 1;
            }
        });

        return counterObj;
    }

    function deleteTaskById(index) {
        for (let i = 0; i < tasks.length; ++i) {
            if (index == tasks[i]['id']) {
                tasks.splice(i, 1);
                break;
            }
        }
        saveToLocalStorage();
    }

    function fillDropdownWithCategories(dropdown) {
        dropdown.innerHTML = '';

        if (Object.keys(categories).length !== 0) {
            dropdown.innerHTML = '<option value="" selected disabled>Select a category</option>';
            Object.keys(categories).forEach((category) => {
                dropdown.innerHTML += `
                    <option value="${categories[category].name}">${categories[category].name}</option>
                `;
            });
        } else {
            dropdown.innerHTML = '<option value="" selected disabled>No categories available</option>';
        }
    }

    function deleteOverDueTasks() {
        let n = tasks.length - 1;
        let i = 0;

        const dateNow = new Date();
        const msPerDay = 24 * 60 * 60 * 1000;

        while (i <= n) {
            const t = new Date(tasks[i].dueTime);

            if (((t - dateNow) / msPerDay < -1) && !tasks[i].isArchived) {
                tasks[i] = tasks[n];
                --n;
            } else {
                ++i;
            }
        }

        tasks.splice(n + 1, (tasks.length - n));
        saveToLocalStorage();
    }

    function saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('idCounter', JSON.stringify(idCounter));
    }

    function loadFromLocalStorage() {
        if (localStorage.getItem('tasks')) {
            tasks = JSON.parse(localStorage.getItem('tasks'));
        }

        if (localStorage.getItem('categories')) {
            categories = JSON.parse(localStorage.getItem('categories'));
        }

        if (localStorage.getItem('idCounter')) {
            idCounter = parseInt(JSON.parse(localStorage.getItem('idCounter')));
        }

        return !(!tasks && !categories && !idCounter);
    }

    function archiveTaskById(index) {
        const task = getTaskById(index);
        task.isArchived = !task.isArchived;
        saveToLocalStorage();
    }

    function deleteCategoryByName(name) {
        delete categories[name];

        getTasksByCategory(name).forEach((task) => {
            task.category = undefined;
        });

        saveToLocalStorage();
    }

    function getTaskTitleById(id) {
        return getTaskById(id)['title'];
    }

    return {
        createTask,
        editTask,
        createTaskDoms,
        fillInfoPanelWithData,
        fillEditPanelWithData,
        changeTaskDoneness,
        getDueTasksCounters,
        deleteTaskById,
        createCategory,
        createCategoryDoms,
        fillDropdownWithCategories,
        loadFromLocalStorage,
        archiveTaskById,
        deleteCategoryByName,
        getTaskTitleById
    };
}());

module.exports = {
    taskController
};