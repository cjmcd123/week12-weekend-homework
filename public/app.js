var counter = 0;
var target = 0;
var userAnswers = [];

const makeRequest = function (url, callback) {
  const request = new XMLHttpRequest();
  request.open("GET", url);
  request.addEventListener("load", callback);
  request.send();
}

const clearContent = function(node){
  while (node.hasChildNodes()) {
    node.removeChild(node.lastChild);
  }
}

// generate a pub quiz list of questions & answers
const requestComplete = function (response) {
  let selects = document.getElementById("selects");
  clearContent(selects);
  const json = JSON.parse(response.target.response);
  const jsonqa = json.results;
  let quiz = document.getElementById('pub-quiz');
  quiz.style.display = "block";
  for (var i = 0; i < jsonqa.length; i++) {
    let quizDiv = document.createElement("div");
    quizDiv.setAttribute("id", "qna");
    let pubDiv = document.createElement("div");
    pubDiv.setAttribute("id", "pub-text");
    let title = document.createElement("h1");
    let count = i;
    title.innerText = "Question " + (count+=1) + ":";
    pubDiv.appendChild(title);
    let pquestion = document.createElement("h5");
    let decodequestion = decodeURI(jsonqa[i].question);
    // note: the API returns the questions & answers with html special characters (like &quot;), the decodeURI turns this into proper text
    pquestion.innerHTML = decodequestion;
    pubDiv.appendChild(pquestion);
    let category = document.createElement("h6");
    let decodecategory = decodeURI(jsonqa[i].category);
    category.innerHTML = decodecategory;
    pubDiv.appendChild(category);
    let difficulty = document.createElement("h6");
    let decodedifficulty = decodeURI(jsonqa[i].difficulty);
    difficulty.innerHTML = decodedifficulty;
    pubDiv.appendChild(difficulty);
    quizDiv.appendChild(pubDiv);

    let answers = document.createElement("div");
    answers.setAttribute("id", "answers-div");
    let ulcorrect = document.createElement("ul");
    let thcorrect = document.createElement("th");
    thcorrect.innerText = "Correct Answer";
    ulcorrect.appendChild(thcorrect);
    let licorrect = document.createElement("li");
    let decodecorrect = decodeURI(jsonqa[i].correct_answer);
    licorrect.innerHTML = decodecorrect;
    ulcorrect.appendChild(licorrect);
    answers.appendChild(ulcorrect);

    let ulFalse = document.createElement("ul");
    let thfalse = document.createElement("th");
    thfalse.innerText = "Incorrect Answer";
    ulFalse.appendChild(thfalse);
    let falseAnswers = jsonqa[i].incorrect_answers;
    for (let answer of falseAnswers) {
      let liFalse = document.createElement("li");
      let decodeFalse = decodeURI(answer);
      liFalse.innerHTML = decodeFalse;
      ulFalse.appendChild(liFalse);
    }
    answers.appendChild(ulFalse);
    quizDiv.appendChild(answers);
    quiz.appendChild(quizDiv)
  }
}

// generates on screen questions for the knowledge test
const knowledgeTest = function (response) {
  if (counter < target) {
    counter++;
    let testKnowledge = document.getElementById("knowledge-test");
    clearContent(testKnowledge);
    let textDiv = document.createElement("div");
    textDiv.setAttribute("id", "text");
    let question = document.createElement("h3");
    let decodequestion = decodeURI(response[0].question);
    question.innerHTML = decodequestion;
    textDiv.appendChild(question);
    let category = document.createElement("h6");
    let decodecategory = decodeURI(response[0].category);
    category.innerHTML = decodecategory;
    textDiv.appendChild(category);
    testKnowledge.appendChild(textDiv);
    let answers = response[0].incorrect_answers;
    answers.push(response[0].correct_answer);
    _.shuffle(answers);
    generateAnswerRadio(answers, testKnowledge);
    let correctAnswer = document.createElement("p");
    correctAnswer.innerText = response[0].correct_answer;
    correctAnswer.setAttribute("id", "correct_answer");
    testKnowledge.appendChild(correctAnswer);
    correctAnswer.style.display = "none";
    let button = document.createElement("button");
    button.innerText = "Check Answer";
    selects.appendChild(button);
    button.addEventListener("click", checkAnswer);
    testKnowledge.appendChild(button);
  } else {
    finalResults()
  }
}


// uses API to find all categories
const requestCategory = function (response) {
  const json = JSON.parse(response.target.response);
  const categories = json.trivia_categories;
  generateCategory(categories);
}

// uses API to find single question
const requestSingle = function (response) {
  const json = JSON.parse(response.target.response);
  const result = json.results;
  knowledgeTest(result);
}

// generates the dropbox selects for category, difficulty & number of questions for generating a pubQuiz
const generateDropboxQuiz = function () {
  let choice = document.getElementById("choice");
  choice.style.display = "none";
  let selects = document.getElementById('selects');
  const categoryUrl = "https://opentdb.com/api_category.php";
  makeRequest(categoryUrl, requestCategory);
  generateDifficulty();
  generateQuestionCount();
  let button = document.createElement("button");
  button.innerText = "Start";
  button.addEventListener("click", pubQuiz);
  selects.appendChild(button);
}

// generates the dropbox selects for category, difficulty & number of questions for generating a on screen knowledge test
const generateDropboxTest = function () {
  let choice = document.getElementById("choice");
  choice.style.display = "none";
  let selects = document.getElementById('selects');
  const categoryUrl = "https://opentdb.com/api_category.php";
  makeRequest(categoryUrl, requestCategory);
  generateDifficulty();
  generateQuestionCount();
  let button = document.createElement("button");
  button.innerText = "Start";
  button.addEventListener("click", qaTest);
  selects.appendChild(button);
}

// generates category dropbox
const generateCategory = function (categories) {
  let selects = document.getElementById('cat');
  let categoryDrop = document.createElement("select");
  categoryDrop.classList = "category";
  let defaultOption = document.createElement("option");
  defaultOption.value = null;
  defaultOption.innerText = "All Categories";
  categoryDrop.appendChild(defaultOption);
  for (let category of categories) {
    let option = document.createElement("option");
    option.value = category.id;
    option.innerText = category.name;
    categoryDrop.appendChild(option);
  }
  selects.appendChild(categoryDrop);
}

// generates difficulty dropbox
const generateDifficulty = function () {
  let difficulties = ["easy", "medium", "hard"];
  let selects = document.getElementById('diff');
  let difficultyDrop = document.createElement("select");
  difficultyDrop.classList = "difficulty";
  let defaultOption = document.createElement("option");
  defaultOption.value = null;
  defaultOption.innerText = "All Difficulties";
  difficultyDrop.appendChild(defaultOption);
  for (let difficulty of difficulties) {
    let option = document.createElement("option");
    option.value = difficulty;
    option.innerText = difficulty;
    difficultyDrop.appendChild(option);
  }
  selects.appendChild(difficultyDrop);
}

// generates number of question dropbox
const generateQuestionCount = function () {
  let selects = document.getElementById('count');
  let questionDrop = document.createElement("select");
  questionDrop.classList = "questions";
  for (var i = 10; i < 51; i+= 5) {
    let option = document.createElement("option");
    option.value = i;
    option.innerText = i + " Questions";
    questionDrop.appendChild(option);
  }
  selects.appendChild(questionDrop);
}

// generates radio button style answer options for on screen knowledge test
const generateAnswerRadio = function (answers, location) {
  let action = document.createElement("form");
  action.setAttribute("id", "answer");
  for (let answer of answers) {
    let answerDiv = document.createElement("div");
    answerDiv.setAttribute("id", "answer_div");
    let answerOption = document.createElement("input");
    answerOption.setAttribute("type", "radio");
    answerOption.setAttribute("id", answer);
    answerOption.setAttribute("name", "answer_option");
    answerOption.setAttribute("value", answer);
    answerDiv.appendChild(answerOption);
    var newlabel = document.createElement("Label");
    newlabel.setAttribute("for", answer);
    newlabel.innerHTML = answer;
    answerDiv.appendChild(newlabel);
    action.appendChild(answerDiv);
  }
  location.appendChild(action);
}

// generates url for pubQuiz
const pubQuiz = function () {

  let cat = document.querySelector(".category");
  let category = JSON.parse(cat.value);
  let diff = document.querySelector(".difficulty");
  let difficulty = diff.value;
  let questions = document.querySelector(".questions");
  let questionCount = JSON.parse(questions.value);

  if (category && difficulty !== "null") {
    url = "https://opentdb.com/api.php?amount=" + questionCount + "&category=" + category + "&difficulty=" + difficulty;
  } else if (category && difficulty === "null") {
    url = "https://opentdb.com/api.php?amount=" + questionCount + "&category=" + category;
  } else if (category === null && difficulty !== "null") {
    url = "https://opentdb.com/api.php?amount=" + questionCount + "&difficulty=" + difficulty;
  } else {
    url = "https://opentdb.com/api.php?amount=" + questionCount;
  }
  makeRequest(url, requestComplete);
}

// generates url for on screen knowledge test
const qaTest = function () {
  let cat = document.querySelector(".category");
  let category = JSON.parse(cat.value);
  let diff = document.querySelector(".difficulty");
  let difficulty = diff.value;
  let questions = document.querySelector(".questions");
  target = JSON.parse(questions.value);
  let selects = document.getElementById("selects");
  selects.style.display = "none";

  if (category && difficulty !== "null") {
    url = "https://opentdb.com/api.php?amount=1"+ "&category=" + category + "&difficulty=" + difficulty;
  } else if (category && difficulty === "null") {
    url = "https://opentdb.com/api.php?amount=1"+ "&category=" + category;
  } else if (category === null && difficulty !== "null") {
    url = "https://opentdb.com/api.php?amount=1"+ "&difficulty=" + difficulty;
  } else {
    url = "https://opentdb.com/api.php?amount=1";
  }
  makeRequest(url, requestSingle);
}

// checks the answer choosen by the user
const checkAnswer = function () {
  let answer = document.querySelector('input[name="answer_option"]:checked').value;
  let correctAnswer = document.getElementById("correct_answer").innerText;
  if (answer === correctAnswer) {
    userAnswers.push(true);
  } else {
    userAnswers.push(false);
  }
  makeRequest(url, requestSingle);
}

const finalResults = function () {
  let testKnowledge = document.getElementById("knowledge-test");
  clearContent(testKnowledge);
  let resultHeader = document.createElement("h3");
  resultHeader.innerText = "Your Results";
  testKnowledge.appendChild(resultHeader);
  let correctAnswers = userAnswers.filter(answer => answer === true);
  let resultStatement = document.createElement("h6");
  resultStatement.innerText = "You have got " + correctAnswers.length + " correct out of " + userAnswers.length;
  testKnowledge.appendChild(resultStatement);
}

const app = function () {
  let pubQuizDiv = document.getElementById("pub-quiz");
  pubQuizDiv.style.display = "none";

  let choice = document.getElementById("choice");
  let quizButton = document.createElement("button");
  quizButton.innerText = "Create A Pub Quiz";
  choice.appendChild(quizButton);
  quizButton.addEventListener("click", generateDropboxQuiz);

  let quizTest = document.createElement("button");
  quizTest.innerText = "Take the knowledge Test";
  choice.appendChild(quizTest);
  quizTest.addEventListener("click", generateDropboxTest);

}

window.addEventListener("load", app)
