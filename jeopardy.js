/********************************************************************
------------------- Settings & Table of Contents --------------------
****************************************************************** */

const categories = 6;
const cluesPerCat = 5;

/*___________________________________________________________________

TABLE OF CONTENTS
 (1) getCategoryIds()
 (2) getCategory()
 (3) fillTable()
 (4) showModal()
   4-a) handleClick()
 (5) setupAndStart()
 (6) showLoadingView()
 (7) hideLoadingView()
 (8) Window Event Listener
 (9) Auxillary Functions
   9-a) properFontSize()
   9-b) showModal()
 (10) When DOM Loads
   10-a) Window Event Listener
   10-b) Create Start/Restart Button
   10-c) Create Game Logo
*/


/********************************************************************
 ----------------------- getCategoryIds() ---------------------------
 ********************************************************************

DESCRIPTION:
 --> gets 1000 categories from API
 --> removes categories with fewer clues per category than required (cluesPerCat)
 --> Returns array containing the correct number (categories) of random category ids */

async function getCategoryIds(numCategories, minClues) {
	const categoriesArr = [];
	for (let offset = 0; offset < 10; offset++) {
		const res = await axios.get('https://jservice.io/api/categories', {
			params : { count: 100, offset: `${offset * 100}` }
		});
		for (let category of res.data) {
			if (category.clues_count >= minClues) categoriesArr.push(category.id);
		}
	}

	return _.sampleSize(categoriesArr, numCategories);
}

/********************************************************************
 ------------------------- getCategory() ----------------------------
 ********************************************************************

 DESCRIPTION:
 --> returns an object with a category title and clue information based on a category ID */

async function getCategory(catId) {
	const res = await axios.get('https://jservice.io/api/category', { params: { id: catId } });

  //creates array of clue objects
	const cluesArr = res.data.clues.map(clue => {
		return { question: clue.question, answer: clue.answer, showing: null, value: clue.value };
	});

  // creates category object containing the category title and an array of all clues
	const catObj = {};
	catObj.title = res.data.title;
	catObj.clues = cluesArr;
	return catObj;
}

/********************************************************************
 -------------------------- fillTable() -----------------------------
 ********************************************************************

 DESCRIPTION:
  --> catIdsArr: create array of category IDs based on passing the number of categories and number of clues per category to the getCategoryIds function
  --> catObjsArr: for every id in catIdsArr, passes id integer to getCategory() and receives an object with category information; contains an array of objects containing category information
  --> creates table elements in DOM based on number of categories, clues per category, and category titles received from API */

async function fillTable(catNum, cluesPerCat) {
	const jeopardyGame = [];
	const catIdsArr = await getCategoryIds(catNum, cluesPerCat);

  // get array of category objects
	Promise.all(catIdsArr.map(getCategory)).then(catObjsArr => {
    
    // transfer each object to the jeopardy game
    catObjsArr.forEach(obj =>{

      // if the category contains more clues than requred, take a sampling of the clues to include in the game board
      if (obj.clues.length>cluesPerCat){
        const sampleOfClues=_.sampleSize(obj.clues,cluesPerCat)
        obj.clues=sampleOfClues
      }
      // push category object to the jeopardy game variable
      jeopardyGame.push(obj)
    } );

    // crerate game board
		const jeopardyTable = document.createElement('table');
		jeopardyTable.setAttribute('id', 'jeopardytable');
		const catHeadRow = document.createElement('thead');

    // create table head and data cells and add category titles; append to jeopardy table
		for (let category = 0; category < catNum; category++) {
			const newTd = document.createElement('td');
			const newDiv = document.createElement('div');
			newDiv.classList.add('category-head');
			newDiv.dataset.category = category;
			newDiv.style.fontSize = properFontSize(catObjsArr[category].title);
			newDiv.innerText = catObjsArr[category].title;
			newTd.append(newDiv);
			catHeadRow.append(newTd);
    }
		jeopardyTable.append(catHeadRow);

    // create table body, rows, and spaces named with data attributes denoting each space's category and row; append all to jeopardy table; append table to document body
		const tableBody = document.createElement('tbody');
    for (let clue = 0; clue < cluesPerCat; clue++) {
			const newTr = document.createElement('tr');
			for (let category = 0; category < catNum; category++) {
				const newTd = document.createElement('td');
				const newDiv = document.createElement('div');
				newDiv.classList.add('clue');
				newDiv.dataset.category = category;
				newDiv.dataset.clue = clue;
				newDiv.innerHTML =
					'<img class="clueImg" src="https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fclipartmag.com%2Fimages%2Fanimated-questions-mark-13.png&f=1&nofb=1">';

				newTd.append(newDiv);
				newTr.append(newTd);
			}
			tableBody.append(newTr);
		}
		jeopardyTable.append(tableBody);
		document.body.append(jeopardyTable);

		// hide loading view after the board is loaded into the DOM
		hideLoadingView();

		// add event listeners to all clue divs
		$('.clue').on('click', handleClick);
	});

  //_________________________________________________________________
  
  /* -----> HandleClick() <-----
  DESCRIPTION:
   --> handleClick moved into fillTable() so that jeopardyBoard variable does not have to be global */

	function handleClick(evt) {
		let clickedClue = evt.target;
		if (evt.target.classList.contains('clueImg')) clickedClue = clickedClue.parentElement;

		const categoryNum = clickedClue.getAttribute('data-category');
		const clueNum = clickedClue.getAttribute('data-clue');

		let show = jeopardyGame[categoryNum].clues[clueNum].showing;
		if (show === 'answer') return;

		let question = jeopardyGame[categoryNum].clues[clueNum].question;

		let answer = jeopardyGame[categoryNum].clues[clueNum].answer;

		// console.log(evt.target, show, question, answer);
		clickedClue.classList.add('active');
		clickedClue.innerHTML = '';
		if (show === null) {
			jeopardyGame[categoryNum].clues[clueNum].showing = 'clue';

			console.log(question.length);
			clickedClue.style.fontSize = properFontSize(question);
			clickedClue.innerHTML = `${question}`;
			showModal(question, answer, 'none');
		}
		else if (show === 'clue') {
			jeopardyGame[categoryNum].clues[clueNum].showing = 'answer';
			console.log(answer.length);
			clickedClue.style.fontSize = properFontSize(answer);
			clickedClue.innerHTML = `${answer}`;
			showModal(question, answer, 'clue');
		}
	}
}

/********************************************************************
 -------------------------- setupAndStart() -------------------------
 ********************************************************************

 DESCRIPTION:
  --> shows the loading view and hides the start/restart
  --> runs fillTable() which runs the APIs and builds the game board in the DOM
  --> the loading view is hidden in the fillTable() function immediately after the game board is loaded into the DOM */

async function setupAndStart() {
	showLoadingView();
	let fillTableRes = await fillTable(categories, cluesPerCat);
}

/********************************************************************
 ------------------------- showLoadingView() ------------------------
 ********************************************************************

 DESCRIPTION:
  --> removes any existing game board from the DOM
  --> hides the start/restart button
  --> creates and dislays the loading view */

function showLoadingView() {
	document.querySelector('#startrestartbutton').style.visibility = 'hidden';

	const spinnerImg = document.createElement('img');

	spinnerImg.src =
		'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn2.scratch.mit.edu%2Fget_image%2Fgallery%2F1832260_170x100.png&f=1&nofb=1';
	spinnerImg.classList.add('loading');

	const loadingDiv = document.createElement('div');
	loadingDiv.classList.add('loading');
	loadingDiv.append(spinnerImg);
	document.body.prepend(loadingDiv);

	const jeopardytable = document.querySelector('#jeopardytable');
	if (jeopardytable !== null) jeopardytable.remove();
}

/********************************************************************
 ------------------------- hideLoadingView() ------------------------
 ********************************************************************

 DESCRIPTION:
  --> removes the loading spinner and updates the start/restart button. */

function hideLoadingView() {
	const loadingDiv = document.querySelector('div.loading');
	loadingDiv.remove();

	const startRestartBtn = document.querySelector('#startrestartbutton');
	startRestartBtn.style.visibility = 'visible';
	startRestartBtn.innerText = 'New Game';
	startRestartBtn.classList.remove('start');
	startRestartBtn.classList.add('restart');
}

/********************************************************************
 ----------------------- Auxillary Functions ------------------------
 *******************************************************************/

/* -----> properFontSize() <-----
DESCRIPTION:
 --> returns the font size that fits best in the the space given the character length of the string. */

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

/* -----> showModal() <-----

DESCRIPTION:
 --> shows a modal when passed content text, a title, and the showing state of the object
 --> REFERENCE: https://www.w3schools.com/howto/howto_css_modals.asp */

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

/********************************************************************
 ------------------------- When DOM Loads ---------------------------
 *******************************************************************/

/* -----> Window Event Listener <-----
 
 DESCRIPTION:
  --> adds event listener to remove modal when user clicks outside of modal
  --> adjusts classes to enable css formatting */

 window.addEventListener('click', function(e) {
	const newModalWindow = document.querySelector('#jeopardyModalWindow');
	const newModalBody = document.querySelector('#jeopardyModalBody');
	const newModalHeader = document.querySelector('#jeopardyModalHeader');
	const newModalText = document.querySelector('#jeopardyModalText');
	const newModalTitle = document.querySelector('#jeopardyModalTitle');
	const newModalContent = document.querySelector('#jeopardyModalContent');
	const activeDiv = document.querySelector('.active');
	if (
		e.target == newModalWindow ||
		e.target == newModalBody ||
		e.target == newModalHeader ||
		e.target == newModalText ||
		e.target == newModalTitle ||
		e.target == newModalText ||
		e.target == newModalContent
	) {
		if (activeDiv.classList.contains('started')) {
      activeDiv.classList.add('complete');
      activeDiv.classList.remove('started')
    } else {
      activeDiv.classList.add('started');
    }
		activeDiv.classList.remove('active');
		newModalWindow.remove();
	}
});

//___________________________________________________________________

/* -----> Create Start/Restart Button <-----
 
 DESCRIPTION:
  --> creates the start button and adds it to the document body */
function createStartREstartButton(){
  const startRestartBtn = document.createElement('div');
  startRestartBtn.setAttribute('id', 'startrestartbutton');
  startRestartBtn.innerText = 'Start!';
  startRestartBtn.classList.add('start');
  startRestartBtn.addEventListener('click', setupAndStart);
  return startRestartBtn
}
document.body.prepend(createStartREstartButton())

//___________________________________________________________________

/* -----> Create Game Logo <-----
 
 DESCRIPTION:
  --> creates the game logo and adds it to the document body */
function createLogo(){
  const logoDiv = document.createElement('div');
  logoDiv.setAttribute('id', 'jeopardylogo');
  logoDiv.innerText = 'JEOPARDY!';
  return logoDiv
}
document.body.prepend(createLogo());
