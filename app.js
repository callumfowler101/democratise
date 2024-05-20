const { App } = require("@slack/bolt")

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
})

const ballotObject = {
  question: "",
  numOfAnswers: 0,
  answers: [],
  completionDate: "",
  additionalThresh: 0,
  team: "",
  mandatory: "",
}

const generateBlock = (title, blockType, actionId, firesAction = false) => {
  const tempObj = {
    type: "input",
    element: {
      type: "plain_text_input",
      action_id: actionId,
    },
    label: {
      type: "plain_text",
      text: title,
      emoji: true,
    },
  }

  if (firesAction) tempObj.dispatch_action = true

  switch (blockType) {
    case "text_input":
      tempObj.element.type = "plain_text_input"
      break
    case "date_input":
      tempObj.element.type = "datepicker"
      tempObj.element.initial_date = "2024-05-20"
      tempObj.element.placeholder = {
        type: "plain_text",
        text: "Select a date",
        emoji: true,
      }
    default:
      break
  }

  return tempObj
}

const generateAnswerBlocks = (numOfAnswers) => {
  const answersBlock = []
  for (let i = 0; i < numOfAnswers; i++) {
    const answerBlockTemplate = generateBlock(
      `Answer ${i + 1}`,
      "text_input",
      "answers_log"
    )

    answersBlock.push(answerBlockTemplate)
  }
  answersBlock[answersBlock.length - 1]["dispatch_action"] = true
  return answersBlock
}

const parseResults = (values, actionKey, isDatePicker) => {
  const results = []
  Object.values(values).forEach((e) => {
    const result = isDatePicker
      ? e[actionKey].selected_date
      : e[actionKey].value
    results.push(result)
  })
  return results
}

app.message("hello", async ({ message, say }) => {
  const block = generateBlock("Question", "text_input", "question_log", true)
  await say({
    blocks: [block],
    text: "fallback",
  })
})

app.action("question_log", async ({ body, ack, say }) => {
  await ack()

  const _question = parseResults(body.state.values, "question_log")[0]
  ballotObject.question = _question

  const block = generateBlock(
    "Number of Answers",
    "text_input",
    "num_of_answers_log",
    true
  )
  await say({
    blocks: [block],
    text: "fallback",
  })
})

app.action("num_of_answers_log", async ({ body, ack, say }) => {
  await ack()
  const _numOfAnswers = parseResults(body.state.values, "num_of_answers_log")[0]
  ballotObject.numOfAnswers = _numOfAnswers
  const blocks = generateAnswerBlocks(ballotObject.numOfAnswers)
  await say({ blocks, text: "fallback" })
})

app.action("answers_log", async ({ body, ack, say }) => {
  await ack()
  const _answersArr = parseResults(body.state.values, "answers_log")
  ballotObject.answers = _answersArr
  const block = generateBlock("Select a deadline", "date_input", "date_log")
  await say({ blocks: [block], text: "fallback" })
})

app.action("date_log", async ({ body, ack, say }) => {
  await ack()
  const _date = parseResults(body.state.values, "date_log", true)[0]
  ballotObject.completionDate = _date
})

const main = async () => {
  await app.start(process.env.PORT || 3000)
  console.log("app is running")
}

main()
