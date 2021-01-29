/* ******************************************************************
---------------------------- SETTINGS -------------------------------
****************************************************************** */

const categories = 6;
const cluesPerCat = 5;

// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

/* ******************************************************************
 * --------------------- buildLogicBoard() --------------------------
 * ******************************************************************

 * DESCRIPTION:
 * --> returns an array containing an array for each column (category) and an object for each row in the column.     */

// function buildLogicBoard(categories, cluesPerCat) {
// 	const logicBoard = [];
// 	for (let category = 0; category < categories; category++) {
// 		const categoryArr = [];
// 		for (let clue = 0; clue < cluesPerCat; clue++) {
// 			categoryArr.push({ category: category, clue: clue });
// 		}
// 		logicBoard.push(categoryArr);
// 	}

// 	// console.log('logicBoard',logicBoard)
// 	return logicBoard;
// }

// buildLogicBoard(categories,cluesPerCat)

/* ******************************************************************
 * --------------------- getCategoryIds() ---------------------------
 * ******************************************************************

 * DESCRIPTION:
 * --> gets 1000 categories from API
 * --> removes categories with fewer clues per category than required (cluesPerCat)
 * --> Returns array containing the correct number (categories) of random category ids     */

async function getCategoryIds(numCategories, minClues) {
	const categoriesArr = [];
	for (let offset = 0; offset < 1; offset++) {
		// <----- UPDATE
		const res = await axios.get('https://jservice.io/api/categories', {
			params : { count: 100, offset: `${offset * 100}` }
		});
		for (let category of res.data) {
			if (category.clues_count >= minClues) categoriesArr.push(category.id);
		}
	}

	return _.sampleSize(categoriesArr, numCategories);
}

/* ******************************************************************
 * --------------------- getCategory() ---------------------------
 * ******************************************************************

 * DESCRIPTION:
 * --> returns an object with a category title and clue information based on a category ID     */

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

/* ******************************************************************
 * ------------------------ fillTable() -----------------------------
 * ******************************************************************

 * DESCRIPTION:
 * --> catIdsArr: create array of category IDs based on passing the number of categories and number of clues per category to the getCategoryIds function
 * --> catObjsArr: for every id in catIdsArr, passes id integer to getCategory() and receives an object with category information; contains an array of objects containing category information
 * --> creates table elements in DOM based on number of categories, clues per category, and category titles received from API     */

async function fillTable(catNum, cluesPerCat) {
	const catIdsArr = await getCategoryIds(catNum, cluesPerCat);

	Promise.all(catIdsArr.map(getCategory)).then(catObjsArr => {
		console.log(catObjsArr);

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
	});
}

fillTable(categories, cluesPerCat);

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {}

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
