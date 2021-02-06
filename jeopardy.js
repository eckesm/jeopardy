function playJeopardy() {
	/********************************************************************
	--------------------- Settings & Table of Contents ------------------
	********************************************************************/

	/** INSTRUCTIONS:
	 * - update the CATEGORIES const with an integer to change the number of categories
	 * - update the CLUES const with an integer to change the number of clues per category
	 * - alternatively, can manipulate [(9-b) Create Start/Restart Button] to create start buttons that make board with different numbers of categories or clues 
	 * - if adding additional sounds, be sure to add the audio element to the arrayAudio in [(9-d) Add Sounds to DOM] so that the audio functions properly in [(8-c) playAudio()]
	 * 
	 *  CUSTOMIZATIONS:
	 * - update the SPACEIMAGEURL const with a link to change the image displayed on the game spaces before they are activated
	 * - update the SPINNERIMAGEURL const with a link to change the image displayed when the game is loading
	 */

	const CATEGORIES = 6;
	const CLUES = 5;

	const SPACEIMAGEURL =
		'https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fclipartmag.com%2Fimages%2Fanimated-questions-mark-13.png&f=1&nofb=1';

	const SPINNERIMGURL =
		'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn2.scratch.mit.edu%2Fget_image%2Fgallery%2F1832260_170x100.png&f=1&nofb=1';

	/*___________________________________________________________________

	TABLE OF CONTENTS
	1: getCategoryIds()
	2: getCategory()
	3: fillTable()
		(3-a) handleClick()
	4: generateGameBoard()
	5: setupAndStart()
	6: showLoadingView()
	7: hideLoadingView()
	8: Auxillary Functions
		(8-a) properFontSize()
		(8-b) showModal()
		(8-c) playAudio()
		(8-d) makeAudioButton()
	9: When DOM Loads
		(9-a) Window Event Listener for Modal Click
		(9-b) Create Start/Restart Button
		(9-c) Create Game Logo
		(9-d) Add Sounds to DOM
	*/

	/********************************************************************
	----------------------- 1: getCategoryIds() -------------------------
	********************************************************************/

	/** DESCRIPTION:
	 * - gets 1000 categories from API
	 * - removes categories with fewer clues per category than required (CLUES)
	 * - Returns array containing the correct number (CATEGORIES) of random category ids
	 */
	async function getCategoryIds(numCategories, numClues) {
		const arrCategories = [];
		for (let offset = 0; offset < 10; offset++) {
			const res = await axios.get('https://jservice.io/api/categories', {
				params : { count: 100, offset: `${offset * 100}` }
			});
			for (let category of res.data) {
				if (category.clues_count >= numClues) arrCategories.push(category.id);
			}
		}
		return _.sampleSize(arrCategories, numCategories);
	}

	/********************************************************************
	------------------------ 2: getCategory() ---------------------------
	********************************************************************/

	/** DESCRIPTION:
		* - returns an object with a category title and clue information based on a category ID
		*/
	async function getCategory(idCategory) {
		const res = await axios.get('https://jservice.io/api/category', { params: { id: idCategory } });
		//creates array of clue objects
		const arrClues = res.data.clues.map(clue => {
			return {
				question : clue.question,
				answer   : clue.answer,
				showing  : null,
				value    : clue.value
			};
		});

		// creates category object containing the category title and an array of all clues
		const objCategory = {};
		objCategory.title = res.data.title;
		objCategory.clues = arrClues;
		return objCategory;
	}

	/********************************************************************
	--------------------------- 3: fillTable() --------------------------
	********************************************************************/

	/** DESCRIPTION:
		* - create array of category IDs (arrCategoryIds) by passing the number of categories and number of clues per category to the [1: getCategoryIds()] function
		* - for every id in arrCategoryIds, passes id integer to [2: getCategory()] and receives an object with category information which is put into an array (arrCategoryObjects)
		* - passes numCategory, numClues, and arrCategoryObjects to [4: generateGameBoard()] to create table elements in DOM
		* - uses lodash sampling tool to randomize the order of the clues; in the event that there are more clues in the object than required, will take a random set of clues
		* - hides the load view and adds handleClick event listener to the all .clue divs
		* - jeopardyGame is referenced by handleClick to provide information to game spaces divs and modals
		*/
	async function fillTable(numCategory, numClues) {
		const jeopardyGame = [];
		const arrCategoryIds = await getCategoryIds(numCategory, numClues);

		// get array of category objects
		Promise.all(arrCategoryIds.map(getCategory)).then(arrCategoryObjects => {
			// transfer each object to the jeopardy game with a random sampling of clues
			arrCategoryObjects.forEach(obj => {
				const sampleClues = _.sampleSize(obj.clues, numClues);
				obj.clues = sampleClues;
				jeopardyGame.push(obj);
			});

			// call [4: generateGameBoard()]
			generateGameBoard(numCategory, numClues, arrCategoryObjects);

			// call [8: hideLoadingView()]
			hideLoadingView();

			// add event listener [3-a) handleClick()] to all .clue divs
			$('.clue').on('click', handleClick);
		});

		//_________________________________________________________________
		// -----> (3-a) HandleClick() <-----

		/** DESCRIPTION:
		 * - handleClick is part of fillTable() so that jeopardyBoard variable does not have to be global
		 * - changes the .clue divs and shows question/answer modals
		 */
		function handleClick(evt) {
			let clickedClue = evt.target;
			if (evt.target.classList.contains('clueImg')) clickedClue = clickedClue.parentElement;

			const categoryNum = clickedClue.getAttribute('data-category');
			const clueNum = clickedClue.getAttribute('data-clue');

			// if the clue space has already displayed the answer modal then return; otherwise change the text of the .clue div and show a modal
			let show = jeopardyGame[categoryNum].clues[clueNum].showing;
			if (show === 'answer') return;

			let question = jeopardyGame[categoryNum].clues[clueNum].question;
			let answer = jeopardyGame[categoryNum].clues[clueNum].answer;

			clickedClue.classList.add('active');
			clickedClue.innerHTML = '';
			if (show === null) {
				jeopardyGame[categoryNum].clues[clueNum].showing = 'clue';
				clickedClue.style.fontSize = properFontSize(question);
				clickedClue.innerHTML = `${question}`;
				showModal(question, answer, 'none');
			}
			else if (show === 'clue') {
				jeopardyGame[categoryNum].clues[clueNum].showing = 'answer';
				clickedClue.style.fontSize = properFontSize(answer);
				clickedClue.innerHTML = `${answer}`;
				showModal(question, answer, 'clue');
			}
		}
	}

	/********************************************************************
	----------------------- 4: generateGameBoard() ----------------------
	********************************************************************/

	/**DESCRIPTION:
	 * - creates a game board in the DOM based on the number of categories, the number of clues per category, and an array of category objects containing clues
	 */
	function generateGameBoard(numCategory, numClues, arrCategoryObjects) {
		// create game board
		const jeopardyTable = document.createElement('table');
		jeopardyTable.setAttribute('id', 'jeopardytable');
		const catHeadRow = document.createElement('thead');

		// create table head and data cells and add category titles; append to jeopardy table
		for (let category = 0; category < numCategory; category++) {
			const newTd = document.createElement('td');
			const newDiv = document.createElement('div');
			newDiv.classList.add('category-head');
			newDiv.dataset.category = category;
			newDiv.style.fontSize = properFontSize(arrCategoryObjects[category].title);
			newDiv.innerText = arrCategoryObjects[category].title;
			newTd.append(newDiv);
			catHeadRow.append(newTd);
		}
		jeopardyTable.append(catHeadRow);

		// create table body, rows, and spaces named with data attributes denoting each space's category and row; append all to jeopardy table; append table to document body
		const tableBody = document.createElement('tbody');
		for (let clue = 0; clue < numClues; clue++) {
			const newTr = document.createElement('tr');
			for (let category = 0; category < numCategory; category++) {
				const newTd = document.createElement('td');
				const newDiv = document.createElement('div');
				newDiv.classList.add('clue');
				newDiv.dataset.category = category;
				newDiv.dataset.clue = clue;
				newDiv.innerHTML = `<img class="clueImg" src=${SPACEIMAGEURL}>`;

				newTd.append(newDiv);
				newTr.append(newTd);
			}
			tableBody.append(newTr);
		}
		jeopardyTable.append(tableBody);
		document.body.append(jeopardyTable);
	}

	/********************************************************************
	-------------------------- 5: setupAndStart() -----------------------
	********************************************************************/

	/** DESCRIPTION:
	 * - activated by "Start!" button at begining and "New Game" button once the game is started
	 * -  shows the loading view and hides the start/restart
	 * - runs [3: fillTable()] which runs the APIs and builds the game board in the DOM
	 * - the loading view is hidden in the [3: fillTable()] function immediately after the game board is loaded into the DOM
	 * - plays different sound if the game is loading for the first time or if it is being restarted
	 * -removes audio control button before load screen (it is added back by [7: hideLoadingView()]
	 */
	async function setupAndStart(numCategories, numClues) {
		$('.audiobutton').remove();

		const startrestartbutton = document.querySelector('#startrestartbutton');
		if (startrestartbutton.classList.contains('firstclick')) {
			playAudio(audio_thisIsJeopardy);
			startrestartbutton.classList.remove('firstclick');
		}
		else {
			playAudio(audio_boardFill);
		}

		showLoadingView();
		// let fillTableRes = await fillTable(CATEGORIES, CLUES);
		await fillTable(numCategories, numClues);
	}

	/********************************************************************
	------------------------- 6: showLoadingView() ----------------------
	********************************************************************/

	/** DESCRIPTION:
	 * - removes any existing game board from the DOM
	 * - hides the start/restart button
	 * - creates and dislays the loading view
	 */
	function showLoadingView() {
		document.querySelector('#startrestartbutton').style.visibility = 'hidden';

		const spinnerImg = document.createElement('img');

		spinnerImg.src = SPINNERIMGURL;
		spinnerImg.classList.add('loading');

		const loadingDiv = document.createElement('div');
		loadingDiv.classList.add('loading');
		loadingDiv.append(spinnerImg);
		document.body.prepend(loadingDiv);

		const jeopardytable = document.querySelector('#jeopardytable');
		if (jeopardytable !== null) jeopardytable.remove();
	}

	/********************************************************************
	------------------------- 7: hideLoadingView() ----------------------
	********************************************************************/

	/** DESCRIPTION:
	 * - removes the loading spinner and updates the start/restart button.
	 * - add audio button back in
	 */
	function hideLoadingView() {
		const loadingDiv = document.querySelector('div.loading');
		if (loadingDiv) loadingDiv.remove();

		const startRestartBtn = document.querySelector('#startrestartbutton');
		startRestartBtn.style.visibility = 'visible';
		startRestartBtn.innerText = 'New Game';
		startRestartBtn.classList.remove('start');
		startRestartBtn.classList.add('restart');

		makeAudioButton(audio_themeSong, 'Start Theme Song', 'Stop Theme Song');
	}

	/********************************************************************
	----------------------- 8: Auxillary Functions ----------------------
	********************************************************************/

	// -----> (8-a) properFontSize() <-----
	/**DESCRIPTION:
	 * - returns the font size that fits best in the the space given the character length of the string.
	 */
	function properFontSize(string) {
		if (string.length > 200) return '8px';
		if (string.length > 150) return '10px';
		if (string.length > 100) return '12px';
		if (string.length > 90) return '13px';
		if (string.length > 80) return '14px';
		if (string.length > 70) return '15px';
		if (string.length > 60) return '16px';
		if (string.length > 50) return '18px';
		if (string.length > 40) return '20px';
		if (string.length > 30) return '22px';
		if (string.length > 20) return '24px';
		if (string.length > 10) return '27px';
		return '30px';
	}
	// __________________________________________________________________
	// -----> (8-b) showModal() <-----

	/** DESCRIPTION:
	 * - shows a modal when passed content text, a title, and the showing state of the object
	 * - REFERENCE: https://www.w3schools.com/howto/howto_css_modals.asp
	 */
	function showModal(question, answer, showing) {
		let showTitle, showText;
		showing === 'none' ? (showTitle = 'Question') : (showTitle = 'Answer');
		showing === 'none' ? (showText = question) : (showText = answer);

		let modalText = `
		<div id="jeopardyModalWindow" class="modal">
			<div id="jeopardyModalContent" class="modal-content ${showTitle.toLowerCase()}">
				<div id="jeopardyModalHeader" class="modal-header ${showTitle.toLowerCase()}">
					<h2 id="jeopardyModalTitle">${showTitle}</h2>
				</div>
				<div id="jeopardyModalBody" class="modal-body">
					<p id="jeopardyModalText" class="modal-text">${showText}</p>
				</div>
			</div>
		</div>
		`;
		$(`${modalText}`).appendTo(document.body);

		const newModalWindow = document.querySelector('#jeopardyModalWindow');
		newModalWindow.style.display = 'block';
	}
	//___________________________________________________________________
	// -----> (8-c) playAudio() <-----

	/** DESCRIPTION:
	 * - stops other audio, starts audio at beginning, plays audio
	 */
	function playAudio(audioElement) {
		// pause all sounds loaded into arrayAudio in [9-d: Add Sounds to DOM]
		for (let sound of arrayAudio) {
			sound.pause();
		}

		// restart and play sound
		audioElement.currentTime = 0;
		audioElement.play();
	}
	//___________________________________________________________________
	// -----> (8-d) makeAudioButton() <-----

	/** DESCRIPTION:
	 * - creates and appends a button that plays and pauses a sound
	 * - button text changes based on values passed to function
	 * - interacts with [(8-c) playAudio()] to stop other sounds before starting button activated sound from the start
	 */
	function makeAudioButton(audioElement, playText, pauseText) {
		const audioBtn = document.createElement('div');
		audioBtn.classList.add('audiobutton');

		// add event listener
		audioBtn.addEventListener('click', function() {
			audioBtn.classList.toggle('playing');
			if (audioElement.paused === true) {
				playAudio(audioElement);
				audioBtn.innerText = pauseText;
			}
			else {
				audioElement.pause();
				audioBtn.innerText = playText;
			}
		});
		audioBtn.innerText = playText;
		document.body.append(audioBtn);
	}

	/********************************************************************
	------------------------- 9: When DOM Loads -------------------------
	********************************************************************/

	// -----> (9-a) Window Event Listener for Modal Click <-----

	/** DESCRIPTION:
	 * - adds event listener to remove question/answer modal when user clicks anywhere on modal or window
	 * - adjusts game space div classes to enable css formatting
	 */
	window.addEventListener('click', function(e) {
		const newModalWindow = document.querySelector('#jeopardyModalWindow');
		const activeDiv = document.querySelector('.active');
		if (
			e.target == newModalWindow ||
			e.target == document.querySelector('#jeopardyModalBody') ||
			e.target == document.querySelector('#jeopardyModalHeader') ||
			e.target == document.querySelector('#jeopardyModalText') ||
			e.target == document.querySelector('#jeopardyModalTitle') ||
			e.target == document.querySelector('#jeopardyModalContent') ||
			e.target == document.querySelector('#jeopardyModalWindow') ||
			e.target == document.querySelector('#modalClose')
		) {
			// if the space has not been started, add class of "started"
			// if the space has been started, add class of "complete" and remove "started"
			// remove class of "active" when leaving modal
			if (activeDiv.classList.contains('started')) {
				activeDiv.classList.add('complete');
				activeDiv.classList.remove('started');
			}
			else {
				activeDiv.classList.add('started');
			}
			activeDiv.classList.remove('active');
			newModalWindow.remove();
		}

		if (e.target.classList.contains('clue') || e.target.classList.contains('clueImg')){
			console.log('clue')
		} else {
			console.log('not clue')
			if (newModalWindow) newModalWindow.remove()
		};
	});
	//___________________________________________________________________
	// -----> (9-b) Create Start/Restart Button <-----

	/** DESCRIPTION:
	 * - creates the start button and adds it to the document body
	 * - button defaults to building a board based on settings at top of script
	 */
	function createStartRestartButton(numCategories, numClues) {
		const startRestartBtn = document.createElement('div');
		startRestartBtn.setAttribute('id', 'startrestartbutton');
		startRestartBtn.innerText = 'Start!';
		startRestartBtn.classList.add('start');
		startRestartBtn.classList.add('firstclick');
		startRestartBtn.addEventListener('click', function() {
			setupAndStart(numCategories, numClues);
		});
		return startRestartBtn;
	}
	document.body.prepend(createStartRestartButton(CATEGORIES, CLUES));
	//___________________________________________________________________
	// -----> (9-c) Create Game Logo <-----

	/** DESCRIPTION:
	 * - creates the game logo and adds it to the document body
	 */
	const logoDiv = document.createElement('div');
	logoDiv.setAttribute('id', 'jeopardylogo');
	logoDiv.innerText = 'JEOPARDY!';
	document.body.prepend(logoDiv);
	//___________________________________________________________________
	// -----> (9-d) Add Sounds to DOM <-----

	/** DESCRIPTION:
	 * - appends sounds into the DOM that are used by other funnctions
	 * - sounds are added to arrayAudio so that they can be cycled through and systematically paused before playing another sound in  [(8-c) playAudio()]
	 */
	const audio_themeSong = document.createElement('audio');
	audio_themeSong.setAttribute('id', 'themesong');
	audio_themeSong.src = 'sounds/Jeopardy-theme-song.mp3';
	document.body.append(audio_themeSong);

	const audio_boardFill = document.createElement('audio');
	audio_boardFill.setAttribute('id', 'boardfill');
	audio_boardFill.src = 'sounds/board-fill.mp3';
	document.body.append(audio_boardFill);

	const audio_thisIsJeopardy = document.createElement('audio');
	audio_thisIsJeopardy.setAttribute('id', 'audio_thisisjeopardy');
	audio_thisIsJeopardy.src = 'sounds/this-is.mp3';
	document.body.append(audio_thisIsJeopardy);

	// add sounds to array for use in other function
	const arrayAudio = [ audio_themeSong, audio_boardFill, audio_thisIsJeopardy ];
}

// START GAME
playJeopardy();
