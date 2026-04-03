const GREETINGS = [
    (name) => `Hi ya ${name}! `,
    (name) => `Sba7/Msa2 el 5eer ya ${name}!!`,
    (name) => `Hey, ${name}!!`,
    (name) => `Welcome ya...${name}!!`,
    (name) => `Hello ya ${name}`,
    (name) => `Guten Tag ya ${name}`
];

function getRandomGreeting(name) {
    const randomIndex = Math.floor(Math.random() * GREETINGS.length);
    return GREETINGS[randomIndex](name);
}
 
function getUserName() {
    return localStorage.getItem('userName');
}

function setUserName(name) {
    localStorage.setItem('userName', name);
}

function showDashboard() {
    document.getElementById('name-input-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
}

function showNameInputScreen() {
    document.getElementById('name-input-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
}

function updateGreeting(name) {
    const greetingElement = document.getElementById('greeting');
    greetingElement.textContent = getRandomGreeting(name);
}

function initializeApp() {
    const userName = getUserName();
    
    if (userName) {
        // User has a name stored, show dashboard
        updateGreeting(userName);
        showDashboard();
        initializeStudySessions();
    } else {
        // No name stored, show input screen
        showNameInputScreen();
    }

    // Setup name input handlers
    const nameInput = document.getElementById('name-input');
    const nameSubmitBtn = document.getElementById('name-submit-btn');
    const changeNameBtn = document.getElementById('change-name-btn');

    nameSubmitBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name) {
            setUserName(name);
            updateGreeting(name);
            showDashboard();
            initializeStudySessions();
        } else {
            alert('Please enter your name');
        }
    });

    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            nameSubmitBtn.click();
        }
    });

    changeNameBtn.addEventListener('click', () => {
        nameInput.value = '';
        showNameInputScreen();
        nameInput.focus();
    });
}

function initializeStudySessions() {
    const sessionsContainer = document.getElementById('sessions-container');
    const addSessionButton = document.getElementById('add-session');

    let sessions = JSON.parse(localStorage.getItem('sessions')) || [];
    let activeTimerIndex = null;
    let timerInterval = null;

    function saveSessions() {
        localStorage.setItem('sessions', JSON.stringify(sessions));
    }

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function renderSessions() {
        sessionsContainer.innerHTML = '';
        sessions.forEach((session, index) => {
            const sessionElement = document.createElement('div');
            sessionElement.classList.add('session');
            sessionElement.id = `session-${index}`;
            
            // Ensure targetDuration is set
            if (!session.targetDuration || session.targetDuration <= 0) {
                session.targetDuration = 0;
            }
            
            const elapsedDisplay = formatTime(session.time);
            const targetDisplay = formatTime(session.targetDuration);
            let timerDisplay = `${elapsedDisplay} / ${targetDisplay}`;
            let completedClass = '';
            
            if (session.targetDuration > 0 && session.time >= session.targetDuration) {
                timerDisplay = `${targetDisplay} / ${targetDisplay} ✔`;
                completedClass = 'completed';
            }

            const isEditable = !session.running && session.time === 0;
            const hours = Math.floor(session.targetDuration / 3600);
            const minutes = Math.floor((session.targetDuration % 3600) / 60);

            sessionElement.innerHTML = `
                <div class="session-header">
                    <div class="session-title-container">
                        <span class="session-label" data-index="${index}">${session.label}</span>
                        <button class="edit-label" data-index="${index}" title="Edit session name">✏️</button>
                    </div>
                    <button class="delete-session" data-index="${index}">➖</button>
                </div>
                <div class="duration-control" ${isEditable ? '' : 'style="display: none;"'}>
                    <label>Duration:</label>
                    <div class="duration-inputs">
                        <div class="duration-group">
                            <button class="duration-decrease hours" data-index="${index}">−</button>
                            <input type="number" class="duration-input hours" data-index="${index}" value="${hours}" min="0" max="99" placeholder="HH">
                            <span class="duration-unit">hours</span>
                            <button class="duration-increase hours" data-index="${index}">+</button>
                        </div>
                        <div class="duration-separator">:</div>
                        <div class="duration-group">
                            <button class="duration-decrease minutes" data-index="${index}">−</button>
                            <input type="number" class="duration-input minutes" data-index="${index}" value="${minutes}" min="0" max="59" placeholder="MM">
                            <span class="duration-unit">min</span>
                            <button class="duration-increase minutes" data-index="${index}">+</button>
                        </div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${session.targetDuration > 0 ? Math.min((session.time / session.targetDuration) * 100, 100) : 0}%"></div>
                </div>
                <div class="timer">
                    <span class="timer-display">${timerDisplay}</span>
                </div>
                <div class="session-controls">
                    <button class="start" data-index="${index}" ${session.targetDuration <= 0 ? 'disabled' : ''}>▶ Start</button>
                    <button class="pause" data-index="${index}">⏸ Pause</button>
                    <button class="reset" data-index="${index}">↻ Reset</button>
                </div>
            `;

            if (completedClass) {
                sessionElement.classList.add(completedClass);
            }

            sessionsContainer.appendChild(sessionElement);
        });

        attachDurationEventListeners();
        attachLabelEventListeners();
    }

    function attachLabelEventListeners() {
        document.querySelectorAll('.edit-label').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const labelSpan = document.querySelector(`.session-label[data-index="${index}"]`);
                const currentLabel = labelSpan.textContent;

                const inputField = document.createElement('input');
                inputField.type = 'text';
                inputField.className = 'label-edit-input';
                inputField.value = currentLabel;

                labelSpan.replaceWith(inputField);
                inputField.focus();
                inputField.select();

                function saveLabel() {
                    const newLabel = inputField.value.trim() || `Session ${index + 1}`;
                    sessions[index].label = newLabel;
                    saveSessions();
                    renderSessions();
                }

                function cancelEdit() {
                    renderSessions();
                }

                inputField.addEventListener('blur', saveLabel);
                inputField.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        saveLabel();
                    } else if (e.key === 'Escape') {
                        cancelEdit();
                    }
                });
            });
        });
    }

    function attachDurationEventListeners() {
        // Helper function to update display without re-rendering
        function updateDurationDisplay(index) {
            const session = sessions[index];
            const sessionElement = document.getElementById(`session-${index}`);
            if (!sessionElement) return;

            const hoursInput = document.querySelector(`.duration-input.hours[data-index="${index}"]`);
            const minutesInput = document.querySelector(`.duration-input.minutes[data-index="${index}"]`);
            const timerSpan = sessionElement.querySelector('.timer-display');

            if (hoursInput && minutesInput) {
                const hours = parseInt(hoursInput.value) || 0;
                const minutes = parseInt(minutesInput.value) || 0;
                session.targetDuration = hours * 3600 + minutes * 60;
            }

            if (timerSpan && session.targetDuration > 0) {
                const elapsedDisplay = formatTime(session.time);
                const targetDisplay = formatTime(session.targetDuration);
                timerSpan.textContent = `${elapsedDisplay} / ${targetDisplay}`;
            }

            const startBtn = sessionElement.querySelector('.start');
            if (startBtn) {
                startBtn.disabled = session.targetDuration <= 0;
            }

            saveSessions();
        }

        // Hours input
        document.querySelectorAll('.duration-input.hours').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                let hours = parseInt(e.target.value) || 0;
                
                if (hours < 0) hours = 0;
                if (hours > 99) hours = 99;
                
                e.target.value = hours;
                updateDurationDisplay(index);
            });

            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                let hours = parseInt(e.target.value) || 0;
                
                if (hours < 0) hours = 0;
                if (hours > 99) hours = 99;
                
                updateDurationDisplay(index);
            });
        });

        // Minutes input
        document.querySelectorAll('.duration-input.minutes').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                let minutes = parseInt(e.target.value) || 0;
                
                if (minutes < 0) minutes = 0;
                if (minutes > 59) minutes = 59;
                
                e.target.value = minutes;
                updateDurationDisplay(index);
            });

            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                let minutes = parseInt(e.target.value) || 0;
                
                if (minutes < 0) minutes = 0;
                if (minutes > 59) minutes = 59;
                
                updateDurationDisplay(index);
            });
        });

        // Hours decrease
        document.querySelectorAll('.duration-decrease.hours').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const hoursInput = document.querySelector(`.duration-input.hours[data-index="${index}"]`);
                let hours = parseInt(hoursInput.value) || 0;
                
                if (hours > 0) {
                    hours--;
                    hoursInput.value = hours;
                    updateDurationDisplay(index);
                }
            });
        });

        // Hours increase
        document.querySelectorAll('.duration-increase.hours').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const hoursInput = document.querySelector(`.duration-input.hours[data-index="${index}"]`);
                let hours = parseInt(hoursInput.value) || 0;
                
                if (hours < 99) {
                    hours++;
                    hoursInput.value = hours;
                    updateDurationDisplay(index);
                }
            });
        });

        // Minutes decrease
        document.querySelectorAll('.duration-decrease.minutes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const hoursInput = document.querySelector(`.duration-input.hours[data-index="${index}"]`);
                const minutesInput = document.querySelector(`.duration-input.minutes[data-index="${index}"]`);
                let hours = parseInt(hoursInput.value) || 0;
                let minutes = parseInt(minutesInput.value) || 0;
                
                if (minutes > 0) {
                    minutes--;
                } else if (hours > 0) {
                    hours--;
                    minutes = 59;
                }
                hoursInput.value = hours;
                minutesInput.value = minutes;
                updateDurationDisplay(index);
            });
        });

        // Minutes increase
        document.querySelectorAll('.duration-increase.minutes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const hoursInput = document.querySelector(`.duration-input.hours[data-index="${index}"]`);
                const minutesInput = document.querySelector(`.duration-input.minutes[data-index="${index}"]`);
                let hours = parseInt(hoursInput.value) || 0;
                let minutes = parseInt(minutesInput.value) || 0;
                
                if (minutes < 59) {
                    minutes++;
                } else if (hours < 99) {
                    hours++;
                    minutes = 0;
                }
                hoursInput.value = hours;
                minutesInput.value = minutes;
                updateDurationDisplay(index);
            });
        });
    }

    function updateSessionDisplay(index) {
        const session = sessions[index];
        const sessionElement = document.getElementById(`session-${index}`);
        
        if (!sessionElement) return;

        const elapsedDisplay = formatTime(session.time);
        const targetDisplay = formatTime(session.targetDuration);
        let timerDisplay = `${elapsedDisplay} / ${targetDisplay}`;
        
        if (session.time >= session.targetDuration) {
            timerDisplay = `${targetDisplay} / ${targetDisplay} ✔`;
            sessionElement.classList.add('completed');
        }

        const progressBar = sessionElement.querySelector('.progress');
        const timerSpan = sessionElement.querySelector('.timer-display');
        
        if (progressBar) {
            progressBar.style.width = `${Math.min((session.time / session.targetDuration) * 100, 100)}%`;
        }
        if (timerSpan) {
            timerSpan.textContent = timerDisplay;
        }
    }

    function startTimer(index) {
        if (!sessions[index].targetDuration || sessions[index].targetDuration <= 0) {
            alert('Please set a duration first.');
            return;
        }

        if (sessions[index].time >= sessions[index].targetDuration) {
            alert('Session already completed! Reset it to run again.');
            return;
        }

        if (activeTimerIndex !== null && activeTimerIndex !== index) {
            alert('Only one session can run at a time. Pause the current session first.');
            return;
        }

        if (activeTimerIndex === index) {
            return;
        }

        activeTimerIndex = index;
        sessions[index].running = true;
        saveSessions();
        renderSessions();

        timerInterval = setInterval(() => {
            const currentSession = sessions[activeTimerIndex];

            if (!currentSession.running || currentSession.time >= currentSession.targetDuration) {
                clearInterval(timerInterval);
                timerInterval = null;
                if (currentSession.time >= currentSession.targetDuration) {
                    currentSession.progress = 100;
                }
                activeTimerIndex = null;
                saveSessions();
                renderSessions();
                return;
            }

            currentSession.time += 1;
            currentSession.progress = (currentSession.time / currentSession.targetDuration) * 100;
            saveSessions();
            updateSessionDisplay(activeTimerIndex);
        }, 1000);
    }

    function pauseTimer(index) {
        if (activeTimerIndex === index) {
            sessions[index].running = false;
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            activeTimerIndex = null;
            saveSessions();
        }
    }

    function resetTimer(index) {
        if (activeTimerIndex === index) {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            activeTimerIndex = null;
        }

        const session = sessions[index];
        session.time = 0;
        session.progress = 0;
        session.running = false;
        saveSessions();
        renderSessions();
    }

    function deleteSession(index) {
        if (activeTimerIndex === index) {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            activeTimerIndex = null;
        }

        sessions.splice(index, 1);
        sessions.forEach((session, i) => {
            session.label = `Session ${i + 1}`;
        });
        saveSessions();
        renderSessions();
    }

    addSessionButton.addEventListener('click', () => {
        const newSession = {
            label: `Session ${sessions.length + 1}`,
            progress: 0,
            time: 0,
            targetDuration: 0,
            running: false
        };
        sessions.push(newSession);
        saveSessions();
        renderSessions();
    });

    sessionsContainer.addEventListener('click', (event) => {
        const index = parseInt(event.target.dataset.index);

        if (event.target.classList.contains('delete-session')) {
            deleteSession(index);
        } else if (event.target.classList.contains('start')) {
            startTimer(index);
        } else if (event.target.classList.contains('pause')) {
            pauseTimer(index);
        } else if (event.target.classList.contains('reset')) {
            resetTimer(index);
        }
    });

    renderSessions();
}

document.addEventListener('DOMContentLoaded', initializeApp);