# Jeopardy

## Play Game
https://eckesm.github.io/jeopardy/

## Branches
**main**: contains only the html, js, and css files requied to play the Jeopardy game  
**dev-branch**: also contains testing files jeopardy-test.html and jeopardy-test.js

## Intructions
1. Click the "Start!" button to load Jeopardy Game
2. By default, the game will load with six random categories each with five clues.  The clues are displayed in the category column in a random order.  If the API returns a category with more than five clues, five random clues will be selected.
3. Click on a light blue clue square to display the question in a modal; this will also update the square to show the question with an appropriate font size and purple background.
4. Click anywhere on the modal or the window to remove the modal and show the full board again.  Click on a purple question square to display the answer in a modal; this will also update the square to show the answer with an appropriate font size and green backgroud.
5. When you would like to start a new game with new categories, click the "New Game" at the top-left of the window.
6. Clik the "Start Theme Song" button to hear the Jeopardy theme song.  When clicked, the button will toggle between "Star..." and "Stop Theme Song" and will restart or pause the music, respectively.  

## Code Information

### **Settings**
- Update the CATEGORIES const to change the number of categories that are loaded in the game board
- Update the CLUES const to change the number of clues displayed per category
- Clue square images and the image/gif displayed when the board is loading can be customized by updating the links.  

### **TABLE OF CONTENTS**
 1. getCategoryIds()
 2. getCategory()
 3. fillTable()  
 *(3-a) handleClick()*
 4. generateGameBoard()
 5. setupAndStart()
 6. showLoadingView()
 7. hideLoadingView()
 8. Auxillary Functions  
 *(8-a) properFontSize()*  
 *(8-b) showModal()*  
 *(8-c) playAudio()*  
 *(8-d) makeAudioButton()*
 9. When DOM Loads  
 *(9-a) Window Event Listener for Modal Click*  
 *(9-b) Create Start/Restart Button*  
 *(9-c) Cre*ate Game Logo*  
 *(9-d) Add Sounds to DOM*  

Detailed information about each function and section of code is provided in the JS scrit file.

### **API Information**
#### **getCategoryIds() API**
Uses jService's API  (https://jservice.io/api/categories) to retrieve categories IDs as integers.  The code currently retrieves a random sample from the first 1,000 categories available from the API; the number of categories sampled can be increased by adjusting the following section of code:  
"*offset < 10*" (it is currently pulling 10 sets of 100 batches)  

#### **getCategory() API**
Uses jService's API (https://jservice.io/api/category) to retrieve detailed category information with clues based on a specific ID integer.