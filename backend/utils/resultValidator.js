const ALLOWED_TRAINERS = [
  "reaction",
  "stroop",
  "verbal",
  "memory",
  "dual",
  "pattern",
  "odd",
  "estimation"
];


function validateResult(data) {
  const errors = [];

  /*
    trainer
  */

  if (
    !data.trainer ||
    typeof data.trainer !== "string"
  ) {
    errors.push(
      "trainer має бути текстовим значенням"
    );
  } else if (
    !ALLOWED_TRAINERS.includes(data.trainer)
  ) {
    errors.push(
      "Невідомий тренажер"
    );
  }


  /*
    score
  */

  if (data.score === undefined) {
    errors.push("score є обов'язковим");
  } else if (
    typeof data.score !== "number" ||
    !Number.isFinite(data.score)
  ) {
    errors.push(
      "score має бути числом"
    );
  } else if (
    data.score < 0 ||
    data.score > 1000000
  ) {
    errors.push(
      "score має бути в межах 0–1000000"
    );
  }


  /*
    accuracy
  */

  if (data.accuracy !== undefined) {
    if (
      typeof data.accuracy !== "number" ||
      !Number.isFinite(data.accuracy)
    ) {
      errors.push(
        "accuracy має бути числом"
      );
    } else if (
      data.accuracy < 0 ||
      data.accuracy > 100
    ) {
      errors.push(
        "accuracy має бути в межах 0–100"
      );
    }
  }


  /*
    averageTime
  */

  if (data.averageTime !== undefined) {
    if (
      typeof data.averageTime !== "number" ||
      !Number.isFinite(data.averageTime)
    ) {
      errors.push(
        "averageTime має бути числом"
      );
    } else if (data.averageTime < 0) {
      errors.push(
        "averageTime не може бути від'ємним"
      );
    }
  }


  /*
    difficulty
  */

  if (data.difficulty !== undefined) {
    if (
      typeof data.difficulty !== "number" ||
      !Number.isFinite(data.difficulty)
    ) {
      errors.push(
        "difficulty має бути числом"
      );
    } else if (
      data.difficulty < 1 ||
      data.difficulty > 100
    ) {
      errors.push(
        "difficulty має бути в межах 1–10"
      );
    }
  }


  /*
    duration
  */

  if (data.duration !== undefined) {
    if (
      typeof data.duration !== "number" ||
      !Number.isFinite(data.duration)
    ) {
      errors.push(
        "duration має бути числом"
      );
    } else if (data.duration < 0) {
      errors.push(
        "duration не може бути від'ємним"
      );
    }
  }


  /*
    metadata
  */

  if (
    data.metadata !== undefined &&
    (
      typeof data.metadata !== "object" ||
      data.metadata === null ||
      Array.isArray(data.metadata)
    )
  ) {
    errors.push(
      "metadata має бути об'єктом"
    );
  }


  return {
    valid: errors.length === 0,
    errors
  };
}


module.exports = {
  validateResult
};