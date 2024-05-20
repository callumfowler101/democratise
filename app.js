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
  const tempObject = {
    type: "",
    element: {
      type: "",
      action_id: actionId,
    },
    label: {
      type: "",
      text: title,
      emoji: true,
    },
  }

  if (firesAction) tempObject.dispatch_action = true

  switch (blockType) {
    case "text_input":
      tempObject.type = "input"
      tempObject.element.type = "plain_text_input"
      tempObject.label.type = "plain_text"
      break
    default:
      break
  }

  return tempObject
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

const parseResults = (values, actionKey) => {
  const results = []
  Object.values(values).forEach((e) => {
    results.push(e[actionKey].value)
  })
  return results
}

app.message("hello", async ({ message, say }) => {
  const block = generateBlock("Question", "text_input", "question_log", true)
  console.log(block)
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
})

const main = async () => {
  await app.start(process.env.PORT || 3000)
  console.log("app is running")
}

main()
