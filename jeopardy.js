/* ******************************************************************
---------------------------- SETTINGS -------------------------------
****************************************************************** */

const categories = 6;
const cluesPerCat = 5;

/********************************************************************
 ----------------------- getCategoryIds() ---------------------------
 ********************************************************************

DESCRIPTION:
 --> gets 1000 categories from API
 --> removes categories with fewer clues per category than required (cluesPerCat)
 --> Returns array containing the correct number (categories) of random category ids
 */

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
 --> returns an object with a category title and clue information based on a category ID
 */

async function getCategory(catId) {
	const res = await axios.get('https://jservice.io/api/category', { params: { id: catId } });

	const cluesArr = res.data.clues.map(clue => {
		return { question: clue.question, answer: clue.answer, showing: null, value: clue.value };
	});

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
  --> creates table elements in DOM based on number of categories, clues per category, and category titles received from API
  */

async function fillTable(catNum, cluesPerCat) {
	const jeopardyGame = [];
	const catIdsArr = await getCategoryIds(catNum, cluesPerCat);

	Promise.all(catIdsArr.map(getCategory)).then(catObjsArr => {
		console.log(catObjsArr);
		catObjsArr.forEach(obj => jeopardyGame.push(obj));

		const jeopardyTable = document.createElement('table');
		const catHeadRow = document.createElement('thead');

		for (let category = 0; category < catNum; category++) {
			const newTd = document.createElement('td');
			const newDiv = document.createElement('div');
			newDiv.classList.add('category-head');
			newDiv.dataset.category = category;
			newDiv.innerText = catObjsArr[category].title;
			newTd.append(newDiv);
			catHeadRow.append(newTd);
		}
		jeopardyTable.append(catHeadRow);

		const tableBody = document.createElement('tbody');
		for (let clue = 0; clue < cluesPerCat; clue++) {
			const newTr = document.createElement('tr');
			for (let category = 0; category < catNum; category++) {
				const newTd = document.createElement('td');
				const newDiv = document.createElement('div');
				newDiv.classList.add('clue');
				newDiv.dataset.category = category;
				newDiv.dataset.clue = clue;
				newDiv.innerText = '?';
				newTd.append(newDiv);
				newTr.append(newTd);
			}
			tableBody.append(newTr);
		}
		jeopardyTable.append(tableBody);
		document.body.prepend(jeopardyTable);

		// add event listeners to all clue divs
		$('.clue').on('click', handleClick);
	});

	// ________________________________________________________________

	// handleClick moved into fillTable() so that jeopardyBoard variable does not have to be global
	function handleClick(evt) {
		// function syncBoardToJeopardyGame() {
		// 	const completedSpaces = document.querySelectorAll('.complete');

		// 	completedSpaces.forEach(space => {
		// 		const categoryNum = space.getAttribute('data-category');
		// 		const clueNum = space.getAttribute('data-clue');
		// 		const jeopardyObj = jeopardyGame[categoryNum].clues[clueNum];
		// 		jeopardyObj.showing = 'answer';
		// 		// console.log(jeopardyObj)
		// 	});
		// }
		// syncBoardToJeopardyGame();

		const categoryNum = evt.target.getAttribute('data-category');
		const clueNum = evt.target.getAttribute('data-clue');

		let show = jeopardyGame[categoryNum].clues[clueNum].showing;
		if (show === 'answer') return;

		let question = jeopardyGame[categoryNum].clues[clueNum].question;

		let answer = jeopardyGame[categoryNum].clues[clueNum].answer;
		if (answer.search('<i>') > -1) {
			answer = answer.substring(3, answer.length - 4);
		}

		// console.log(evt.target, show, question, answer);
		evt.target.classList.add('active');
		if (show === null) {
			jeopardyGame[categoryNum].clues[clueNum].showing = 'clue';
			evt.target.innerText = question;
			showModal(question, answer, 'none');
		}
		else if (show === 'clue') {
			jeopardyGame[categoryNum].clues[clueNum].showing = 'answer';
			evt.target.innerText = answer;
			showModal(question, answer, 'clue');
		}
	}
}

fillTable(categories, cluesPerCat);

/********************************************************************
 -------------------------- showModal() -----------------------------
 ********************************************************************

 DESCRIPTION:
  --> shows a modal when passed content text and a title
  --> adds event listener to remove modal when user clicks outside of modal
  --> adds event listener to show answer if modal is clicked when showing question
  --> REFERENCE: https://www.w3schools.com/howto/howto_css_modals.asp
  */

function showModal(question, answer, showing) {
	let showTitle, showText;
	showing === 'none' ? (showTitle = 'Question') : (showTitle = 'Answer');
	showing === 'none' ? (showText = question) : (showText = answer);

	let modalText = `
  <div id="jeopardyModalWindow" class="modal">
    <div id="jeopardyModalContent" class="modal-content">
      <div id="jeopardyModalHeader" class="modal-header">
        <h2 id="jeopardyModalTitle">${showTitle}</h2>
      </div>
      <div id="jeopardyModalBody" class="modal-body">
        <p id="jeopardyModalText">${showText}</p>
      </div>
    </div>
  </div>
  `;
	$(`${modalText}`).appendTo(document.body);

	const newModalWindow = document.querySelector('#jeopardyModalWindow');
	newModalWindow.style.display = 'block';
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {}

/** On click of start / restart button, set up game. */

// TODO

/** On page load, add event handler for clicking clues */

// TODO

// .click(function(evt){
//   console.log('clicked',evt.target)
// })

// add event listener to window
window.addEventListener('click', function(e) {
	const newModalWindow = document.querySelector('#jeopardyModalWindow');
	const newModalBody = document.querySelector('#jeopardyModalBody');
	const newModalHeader = document.querySelector('#jeopardyModalHeader');
	const activeDiv = document.querySelector('.active');
	if (e.target == newModalWindow || e.target == newModalBody || e.target == newModalHeader) {
		if (activeDiv.classList.contains('started')) {
			activeDiv.classList.add('complete');
		}
		activeDiv.classList.remove('active');
		activeDiv.classList.add('started');
		newModalWindow.remove();
	}
});
