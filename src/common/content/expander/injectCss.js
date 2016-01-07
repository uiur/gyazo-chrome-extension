const css = `
.gz-circle-loader {
  display: inline-block;
  text-indent: -9999em;
  margin: 0;
  border-top: 8px solid rgba(0, 0, 0, .2);
  border-right: 8px solid rgba(0, 0, 0, .2);
  border-bottom: 8px solid rgba(0, 0, 0, .2);
  border-left: 8px solid #000;
  animation: spin 1.1s infinite linear;

  border-radius: 50%;
  width: 32px;
  height: 32px;

  &:after {
    border-radius: 50%;
    width: 32px;
    height: 32px;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
`

module.exports = function () {
  const node = document.createElement('style')
  node.innerHTML = css
  document.body.appendChild(node)
}
