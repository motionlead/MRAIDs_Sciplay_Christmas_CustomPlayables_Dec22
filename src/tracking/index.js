// Time tracking
const timeoutIds = [5, 10, 15].forEach((time) =>
  setTimeout(() => {
    ad.track('time' + time);
  }, time * 1000)
);

// We clear all timeouts set
ad.on('cleanup', function () {
  timeoutIds.forEach(clearTimeout);
});

/**
 *  Register the tracking of the first_interaction event on a container
 *
 *  @param {Container}  container - A createjs container
 */
const setupFirstInteractionTracking = function (container) {
  if (!container) {
    throw new Error('A container needs to be passed');
  }

  container.on('mousedown', () => ad.track('first_interaction'), null, true);
};

module.exports = {
  setupFirstInteractionTracking: setupFirstInteractionTracking,
};
