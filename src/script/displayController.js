const { taskController } = require('./taskController');
const DOMPURIFY = require('dompurify');

let displayController = (function () {
    const header = document.querySelector('#header');
    const container = document.querySelector('#container');

    const headerSearchBtn = document.querySelector('#headerSearchBtn');
    const searchBar = document.querySelector('.header--form');
    searchBar.style.top = `${header.offsetHeight}px`;
    const headerAddTaskBtn = document.querySelector("#headerAddTaskBtn");
    const mainPanelAddTaskBtn = document.querySelector('#mainPanelAddTaskBtn');
    const overlay = document.querySelector('.overlay');
    const modal = document.querySelector('.modal');
    const taskPanel = document.querySelector('#taskPanel');
    const taskAddTimeBtn = document.querySelector('#taskAddTimeBtn');
    const hideTaskAddTimeBtn = document.querySelector('#hideTaskAddTimeBtn');
    const taskAddTimeBar = document.querySelector('#taskAddTimeBtn + div');

    if (taskAddTimeBar) {
        const today = new Date();
        taskAddTimeBar.querySelector('input[type="date"]').min =
            `${today.getFullYear()}-${today.getMonth() <= 8 ? '0' + (today.getMonth() + 1) : (today.getMonth() + 1)}-${today.getDate()}`;
    }

    const taskAddCategoryBtn = document.querySelector('#taskAddCategoryBtn');
    const hideTaskAddCategoryBtn = document.querySelector('#hideTaskAddCategoryBtn');
    const taskAddCategoryBar = document.querySelector('#taskAddCategoryBtn + div');
    const taskForm = document.querySelector('#taskForm');
    const taskWrapper = document.querySelector('#taskWrapper');
    const taskMarkdownButtons = document.querySelectorAll('.modal--form__note--btns > button');
    const taskAddPriorityBtn = document.querySelector('#taskAddPriorityBtn');
    const hideTaskAddPriorityBtn = document.querySelector('#hideTaskAddPriorityBtn');
    const taskAddPriorityBar = document.querySelector('#taskAddPriorityBtn + div');

    const morePanel = document.querySelector('#morePanel');

    const addCategoryBtn = document.querySelector('#addCategoryBtn');
    const addCategoryPanel = document.querySelector('#addCategoryBtn + div');
    const hideAddCategoryBtn = document.querySelector('#hideAddCategoryBtn');
    const newCategoryForm = document.querySelector('#newCategoryForm');
    const newCategoryLabel = document.querySelector('#newCategoryLabel');
    const categoryWrapper = document.querySelector('#categoryWrapper');

    const menuFilters = [document.querySelector('#todayTasksFilter'), document.querySelector('#allTasksFilter'), document.querySelector('#next7DaysTasksFilter'), document.querySelector('#archivedTasksFilter'), document.querySelector('.header--btns__uncompleted'), document.querySelector('.header--btns__archive')];
    const counterDots = [document.querySelector('.header--btns__uncompleted--dot'), document.querySelector('#allTasksCounter'), document.querySelector('#todayTasksCounter'), document.querySelector('#nextDaysTasksCounter')];

    let currentFilter = 'All&&';

    const popup = document.querySelector('.popup');
    let popupTimeoutId = null;

    const searchInput = document.querySelector('#searchInput');

    function toggleHeader(e) {
        if (window.pageYOffset) {
            container.style.marginTop = `${header.clientHeight}px`;
            header.classList.add('fixed');
        } else {
            header.classList.remove('fixed');
            container.style.marginTop = 0;
        }
    }

    function showAddTimeBar(e) {
        hideTaskAddTimeBtn.addEventListener('click', hideAddTimeBar);
        taskAddTimeBtn.classList.add('hidden');
        taskAddTimeBar.classList.remove('hidden');
    }

    function hideAddTimeBar(e) {
        taskAddTimeBtn.classList.remove('hidden');
        taskAddTimeBar.classList.add('hidden');
        hideTaskAddTimeBtn.removeEventListener('click', hideAddTimeBar);
        taskForm.querySelector('#taskTime').value = '';
    }

    function showAddCategoryBar(e) {
        hideTaskAddCategoryBtn.addEventListener('click', hideAddCategoryBar);
        taskAddCategoryBtn.classList.add('hidden');
        taskAddCategoryBar.classList.remove('hidden');
    }

    function hideAddCategoryBar(e) {
        taskAddCategoryBtn.classList.remove('hidden');
        taskAddCategoryBar.classList.add('hidden');
        hideTaskAddCategoryBtn.removeEventListener('click', hideAddCategoryBar);
        taskForm.querySelector('#taskCategory').value = '';
    }

    function showAddPriorityBar(e) {
        hideTaskAddPriorityBtn.addEventListener('click', hideAddPriorityBar);
        taskAddPriorityBtn.classList.add('hidden');
        taskAddPriorityBar.classList.remove('hidden');
    }

    function hideAddPriorityBar(e) {
        hideTaskAddPriorityBtn.removeEventListener('click', hideAddPriorityBar);
        taskAddPriorityBtn.classList.remove('hidden');
        taskAddPriorityBar.classList.add('hidden');
        taskForm.querySelector('#taskPriority').value = '';
    }

    function showTaskPanel(e, title, btnText, handleFn, index) {
        showPanels(e);
        e.preventDefault();

        taskPanel.classList.remove('hidden');
        taskPanel.querySelector('.modal--title').innerText = title;
        taskPanel.querySelector('#taskSubmitBtn').innerText = btnText;

        taskForm.removeEventListener('submit', handleAddTask);
        taskForm.removeEventListener('submit', handleEditTask);
        taskForm.addEventListener('submit', handleFn);
        taskForm.dataset['postindex'] = index;
        document.activeElement.blur();
    }

    function resetFormDisplay(e) {
        taskForm.reset();
        taskForm.querySelector('.modal--form__title--error').classList.add('hidden');
    }

    function hideTaskPanel(e) {
        taskPanel.classList.add('hidden');
        hideAddTimeBar();
        hideAddCategoryBar();
        hideAddPriorityBar();
        resetFormDisplay();
    }

    function showPanels(e) {
        overlay.classList.add('active');
        modal.classList.add('active');
    }

    function hidePanels(e) {
        if (e.type === 'click' || (e.type === 'keydown' && e.key === 'Escape')) {
            overlay.classList.remove('active');
            modal.classList.remove('active');
            setTimeout(() => {
                hideTaskPanel();
                hideTaskMore();
            }, 200);
        }
    }

    function getFormData(form) {
        const formElements = form.elements;

        return {
            'title': DOMPURIFY.sanitize(formElements[0].value),
            'note': DOMPURIFY.sanitize(formElements[8].value, {USE_PROFILES: {html: true}}),
            'dueTime': formElements[10].value,
            'category': {
                'name': formElements[13].value
            },
            'priority': formElements[16].value === '' ? 4 : parseInt(formElements[16].value),
        };
    }

    function populateTaskDom() {
        let taskDOMs = taskController.createTaskDoms(currentFilter);
        taskWrapper.innerHTML = '';

        Object.keys(taskDOMs).forEach((tag) => {
            if (taskDOMs[tag] !== '') {
                taskWrapper.innerHTML += `
                    <section class="main-panel--days">
                        <h2>${tag}</h2>
                    </section>
                    <section class="main-panel--tasks">
                        <ul class="main-panel--tasks__list">
                            ${taskDOMs[tag]}
                        </ul>
                    </section>
                `;
            }
        });

        addListenersToElements(document.querySelectorAll('.main-panel--tasks__item--info'), 'click', showTaskInfo);
        addListenersToElements(document.querySelectorAll('.main-panel--tasks__item--title > input[type="checkbox"]'), 'change', changeTaskDoneness);
        addListenersToElements(document.querySelectorAll('.main-panel--tasks__item--dropdown__edit'), 'click', editTask);
        addListenersToElements(document.querySelectorAll('.main-panel--tasks__item--dropdown__archive'), 'click', archiveTask);
        addListenersToElements(document.querySelectorAll('.main-panel--tasks__item--dropdown__delete'), 'click', deleteTask);
        setCounterDots();
    }

    function setCounterDots() {
        const dueTasksCounters = taskController.getDueTasksCounters();

        counterDots.forEach((counter) => {
            counter.innerText = dueTasksCounters[counter.dataset['counter']];
        });
    }

    function addListenersToElements(elements, event, fnHandler) {
        elements.forEach((elem) => {
            elem.addEventListener(event, fnHandler);
        });
    }

    function showTaskInfo(e) {
        taskController.fillInfoPanelWithData(this.dataset['postindex'], morePanel);
        showPanels(e);

        morePanel.classList.remove('hidden');

        document.activeElement.blur();
    }

    function hideTaskMore(e) {
        morePanel.classList.add('hidden');
    }

    function changeTaskDoneness(e) {
        if (taskController.changeTaskDoneness(this.dataset['postindex'])) {
            showPopUp(`${taskController.getTaskTitleById(this.dataset['postindex'])} is marked done`);
        } else {
            showPopUp(`${taskController.getTaskTitleById(this.dataset['postindex'])} is marked undone`);
        }

        setCounterDots();
    }

    function deleteTask(e) {
        showPopUp(`Deleting ${taskController.getTaskTitleById(this.dataset['postindex'])}`);
        taskController.deleteTaskById(this.dataset['postindex']);
        populateTaskDom(e);
    }

    function addTask(e) {
        showTaskPanel(e, 'Add a task', 'Create task', handleAddTask, -1);
    }

    function handleAddTask(e) {
        e.preventDefault();
        const data = getFormData(this);

        if (isFormValid(this, data)) {
            showPopUp(`Creating new task ${data['title']}`);

            taskController.createTask(data);
            hidePanels({
                'type': 'click'
            });
            populateTaskDom();
        }

        document.activeElement.blur();
    }

    function editTask(e) {
        taskController.fillEditPanelWithData(this.dataset['postindex'], taskPanel);

        if (taskPanel.querySelector('#taskCategory').value) {
            showAddCategoryBar(e);
        }

        if (taskPanel.querySelector('#taskTime').value) {
            showAddTimeBar(e);
        }

        if (taskPanel.querySelector('#taskPriority').value) {
            showAddPriorityBar(e);
        }

        showTaskPanel(e, 'Edit a task', 'Finalize task', handleEditTask, this.dataset['postindex']);
    }

    function handleEditTask(e) {
        e.preventDefault();
        const data = getFormData(this);

        showPopUp(`Editing ${taskController.getTaskTitleById(this.dataset['postindex'])}`);

        if (isFormValid(this, data)) {
            taskController.editTask(this.dataset['postindex'], data);

            hidePanels({
                'type': 'click'
            });
            populateTaskDom();
        }

        document.activeElement.blur();
    }

    function archiveTask(e) {
        showPopUp(`Archiving ${taskController.getTaskTitleById(this.dataset['postindex'])}`);
        taskController.archiveTaskById(this.dataset['postindex']);
        populateTaskDom(e);
    }

    function isFormValid(form, data) {
        if (!data['title']) {
            form.querySelector('.modal--form__title--error').classList.remove('hidden');
            return false;
        }

        return true;
    }

    function addCategory(e) {
        e.preventDefault();

        showPopUp(`Creating new category ${DOMPURIFY.sanitize(newCategoryLabel.value)}`);

        if (newCategoryLabel.value) {
            taskController.createCategory(DOMPURIFY.sanitize(newCategoryLabel.value));
        }

        hideAddCategoryPanel();
        populateCategoryDom();
    }

    function showAddCategoryPanel(e) {
        document.activeElement.blur();
        addCategoryPanel.classList.remove('hidden');
    }

    function hideAddCategoryPanel(e) {
        addCategoryPanel.classList.add('hidden');
        newCategoryLabel.value = '';
    }

    function populateCategoryDom() {
        categoryWrapper.innerHTML = taskController.createCategoryDoms();
        taskController.fillDropdownWithCategories(taskForm.querySelector('#taskCategory'));
        addListenersToElements(menuFilters, 'click', filterDOM);
        addListenersToElements(categoryWrapper.querySelectorAll('.side-panel--category__title'), 'click', filterDOM);
        addListenersToElements(categoryWrapper.querySelectorAll('.side-panel--category__del'), 'click', deleteCategory);
    }

    function deleteCategory() {
        showPopUp(`Deleting category ${this.dataset['category']}, setting all associated task to uncategorized`);
        taskController.deleteCategoryByName(this.dataset['category']);
        populateCategoryDom();
        populateTaskDom();
    }

    function initialLoad() {
        if (taskController.loadFromLocalStorage()) {
            showPopUp(`Data loaded from local storage`);
        }
        populateCategoryDom();
        populateTaskDom();
    }

    function filterDOM() {
        let tmpFilter = currentFilter.split('&');

        if (this.dataset['filtertype'] === 'menu') {
            document.querySelector('.side-panel--menu').querySelector('.active').classList.remove('active');
            this.classList.add('active');

            if (this.dataset['filter'] !== currentFilter.split('&')[0]) {
                tmpFilter[0] = this.dataset['filter'];
            } else {
                tmpFilter[0] = 'All';
            }
        } else if (this.dataset['filtertype'] === 'category') {
            if (this.dataset['filter'] !== currentFilter.split('&')[1]) {
                tmpFilter[1] = this.dataset['filter'];
            } else {
                tmpFilter[1] = '';
            }
        } else if (this.dataset['filtertype'] === 'header') {
            document.querySelector('.side-panel--menu').querySelector('.active').classList.remove('active');

            if (this.dataset['filter'] === 'All') {
                document.querySelector('.side-panel--menu').querySelector('#allTasksFilter').classList.add('active');
            } else if (this.dataset['filter'] === 'Archived') {
                document.querySelector('.side-panel--menu').querySelector('#archivedTasksFilter').classList.add('active');
            }

            if (this.dataset['filter'] !== currentFilter.split('&')[0]) {
                tmpFilter[0] = this.dataset['filter'];
            } else {
                tmpFilter[0] = 'All';
            }
        }

        currentFilter = tmpFilter.join('&');

        if (tmpFilter[1] !== '') {
            showPopUp('Current filters: ' + tmpFilter[0] + ', ' + tmpFilter[1]);
        } else {
            showPopUp('Current filter: ' + tmpFilter[0]);
        }

        populateTaskDom();
    }

    function showPopUp(msg) {
        const newMsg = document.createElement('div');

        newMsg.classList.add('popup--instance');
        newMsg.innerHTML = `
            <div class="popup--instance__title">
                <svg class="w-6 h-6"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                     xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round"
                         stroke-linejoin="round"
                          stroke-width="2"
                         d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3>Info</h3>
            </div>
            <p class="popup--instance__msg">${msg}</p>
        `;

        popup.appendChild(newMsg);
        setTimeout(() => {
            newMsg.classList.add('show')
        }, 100);

        setTimeout(() => {
            hidePopup(newMsg);
        }, 3000);
    }

    function hidePopup(popupTab) {
        popupTab.classList.remove('show');
        setTimeout(() => {
            popup.removeChild(popupTab);
        }, 250);
    }

    function searchTask(e) {
        let tmpFilter = currentFilter.split('&');
        tmpFilter[2] = this.value;
        currentFilter = tmpFilter.join('&');
        populateTaskDom();
    }

    function addMarkdownSyntaxToInput(e) {
        const taskNoteInput = document.querySelector('#taskNote');

        switch (this.dataset.markdownvalue) {
            case 'h1':
                taskNoteInput.value += '# ';
                break;
            case 'h2':
                taskNoteInput.value += '## ';
                break;
            case 'h3':
                taskNoteInput.value += '### ';
                break;
            case 'ol':
                taskNoteInput.value += '1. ';
                break;
            case 'ul':
                taskNoteInput.value += '- ';
                break;
            case 'b':
                taskNoteInput.value += '** ** ';
                break;
            case 'i': 
                taskNoteInput.value += '* * ';
                break;
            default:
                throw new Error("Invalid markdown input");
        }

        document.activeElement.blur();
    }

    function toggleSearchBar(e) {
        if (searchBar.style.left !== '50%' || searchBar.style.left === '') {
            searchBar.style.left = `50%`;
        } else {
            searchBar.style.left = `-50%`;
        }
    }

    headerAddTaskBtn.addEventListener('click', addTask);
    mainPanelAddTaskBtn.addEventListener('click', addTask);

    headerSearchBtn.addEventListener('click', toggleSearchBar);

    addCategoryBtn.addEventListener('click', showAddCategoryPanel);
    hideAddCategoryBtn.addEventListener('click', hideAddCategoryPanel);
    newCategoryForm.addEventListener('submit', addCategory);

    overlay.addEventListener('click', hidePanels);
    document.addEventListener('keydown', hidePanels);

    searchInput.addEventListener('input', searchTask);

    addListenersToElements(taskMarkdownButtons, 'click', addMarkdownSyntaxToInput);
    taskAddTimeBtn.addEventListener('click', showAddTimeBar);
    taskAddCategoryBtn.addEventListener('click', showAddCategoryBar);
    taskAddPriorityBtn.addEventListener('click', showAddPriorityBar);

    document.addEventListener('scroll', toggleHeader);

    return {
        initialLoad
    };
}());

module.exports = {
    displayController
};