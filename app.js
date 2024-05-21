const { App } = require("@slack/bolt")

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
})

const ballotObject = {
  Question: "",
  Number_of_Answers: 0,
  Answers: [],
  Completion_Date: "",
  Channel: "",
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

const generateRecapBlock = (
  title,
  ballotObj,
  correctActionId,
  incorrectActionId
) => {
  const blocks = []
  const headerObj = {
    type: "header",
    text: {
      type: "plain_text",
      text: title,
      emoji: true,
    },
  }

  blocks.push(headerObj)

  for (const [key, value] of Object.entries(ballotObj)) {
    const obj = {
      type: "context",
      elements: [
        {
          type: "plain_text",
          text: `${key}: ${value}`,
          emoji: true,
        },
      ],
    }
    blocks.push(obj)
  }

  const buttons = {
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Correct",
          emoji: true,
        },
        value: "confirm_ballot",
        action_id: correctActionId,
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Incorrect",
          emoji: true,
        },
        value: "decline_ballot",
        action_id: incorrectActionId,
      },
    ],
  }

  blocks.push(buttons)

  return blocks
}

const generateOptionsBlock = (title, options, actionId) => {
  const tempObj = {
    type: "input",
    element: {
      type: "static_select",
      placeholder: {
        type: "plain_text",
        text: "Select an option",
        emoji: true,
      },
      options: [],
      action_id: actionId,
    },
    label: {
      type: "plain_text",
      text: title,
      emoji: true,
    },
  }

  for (let i = 0; i < options.length; i++) {
    const _object = {
      text: {
        type: "plain_text",
        text: options[i],
        emoji: true,
      },
      value: `value-${i}`,
    }

    tempObj.element.options.push(_object)
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

const parseResults = (values, actionKey, deepKey) => {
  const results = []
  Object.values(values).forEach((e) => {
    let result
    if (deepKey) {
      result = e[actionKey][deepKey]
    } else {
      result = e[actionKey].value
    }
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
  ballotObject.Question = _question

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
  ballotObject.Number_of_Answers = _numOfAnswers
  const blocks = generateAnswerBlocks(ballotObject.numOfAnswers)
  await say({ blocks, text: "fallback" })
})

app.action("answers_log", async ({ body, ack, say }) => {
  await ack()
  const _answersArr = parseResults(body.state.values, "answers_log")
  ballotObject.Answers = _answersArr
  const block = generateBlock("Select a deadline", "date_input", "date_log")
  await say({ blocks: [block], text: "fallback" })
})

app.action("date_log", async ({ body, ack, say }) => {
  await ack()
  const _date = parseResults(body.state.values, "date_log", "selected_date")[0]
  ballotObject.Completion_Date = _date
  const channelList = await app.client.conversations.list()
  const channels = channelList.channels
  const channelNames = channels.map((e) => e.name)
  const optionsBlock = generateOptionsBlock(
    "Choose a channel",
    channelNames,
    "channel_log"
  )
  await say({ blocks: [optionsBlock], text: "fallback" })
})

app.action("channel_log", async ({ body, ack, say }) => {
  await ack()
  console.log(body.state.values)
  const _channel = parseResults(
    body.state.values,
    "channel_log",
    "selected_option"
  )[0].text.text
  ballotObject.Channel = _channel
  const blocks = generateRecapBlock(
    "Please confirm all the ballot information is correct",
    ballotObject,
    "send_ballot",
    "reenter_ballot"
  )

  await say({
    blocks: blocks,
    text: "fallback",
  })
})

app.action("send_ballot", async ({ body, ack, say }) => {
  await ack()
})
app.action("reenter_ballot", async ({ body, ack, say }) => {
  await ack()
})

const main = async () => {
  await app.start(process.env.PORT || 3000)
  console.log("app is running")
}

main()
