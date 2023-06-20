const config = {
  reporters: [
    'default',
    ['jest-html-reporter', { pageTitle: 'Test Report', outputPath: './test-report.html', includeFailureMsg: true}],
  ]
};

module.exports = config;