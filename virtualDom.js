/* A small virtual dom implementation
 * Real dom elements start with a $
 *
 * Transform jsx with this command:
 * npx babel virtualDom.js --out-file index.js
 *
 * The h function is used for formatting the transformed jsx to an object
 *
 */

// util functions
const h = ({ elementName, attributes, children }) => ({
  type: elementName,
  props: attributes || {},
  children: children ? children : []
})

const isEventProp = name => /^on/.test(name)
const isCustomProp = name => isEventProp(name) || name === 'forceUpdate'
const extractEventName = name => name.slice(2).toLowerCase()

// prop handling functions
const setBooleanProp = ($target, name, value) => {
  if (value) {
    $target.setAttribute(name, value)
    $target[name] = true
  } else {
    $target[name] = false
  }
}

const removeBooleanProp = ($target, name) => {
  $target.removeAttribute(name)
  $target[name] = false
}

const setProp = ($target, name, value) => {
  if (isCustomProp(name)) {
    return
  } else if (name === 'className') {
    $target.setAttribute('class', value)
  } else if (typeof value === 'boolean') {
    setBooleanProp($target, name, value)
  } else {
    $target.setAttribute(name, value)
  }
}

const setProps = ($target, props) => {
  Object.keys(props).forEach(name => {
    setProp($target, name, props[name])
  })
}

const removeProp = ($target, name, value) => {
  if (isCustomProp(name)) {
    return
  } else if (name === 'className') {
    $target.removeAttribute('class')
  } else if (typeof value === 'boolean') {
    removeBooleanProp($target, name)
  } else {
    $target.removeAttribute(name)
  }
}

const updateProp = ($target, name, newVal, oldVal) => {
  if (!newVal) {
    removeProp($target, name, oldVal)
  } else if (!oldVal || newVal !== oldVal) {
    setProp($target, name, newVal)
  }
}

const updateProps = ($target, newProps, oldProps = {}) => {
  const props = Object.assign({}, newProps, oldProps)
  Object.keys(props).forEach(name => {
    updateProp($target, name, newProps[name], oldProps[name])
  })
}

// event execution and tracking functions

const addEventListeners = ($target, props) => {
  Object.keys(props).forEach(name => {
    if (isEventProp(name)) {
      $target.addEventListener(extractEventName(name), props[name])
    }
  })
}

// dom and virtual dom modification functions

const createElement = node => {
  if (typeof node === 'string') {
    return document.createTextNode(node)
  }

  const $el = document.createElement(node.type)
  setProps($el, node.props)
  addEventListeners($el, node.props)

  if (node.children) {
    node.children.map(createElement).forEach($el.appendChild.bind($el))
  }

  return $el
}

const changed = (node1, node2) =>
  typeof node1 !== typeof node2 ||
  (typeof node1 === 'string' && node1 !== node2) ||
  node1.type !== node2.type ||
  node1.props
    ? node1.props.forceUpdate
    : false

const updateElement = ($parent, newNode, oldNode, index = 0) => {
  if (!oldNode) {
    $parent.appendChild(createElement(newNode))
  } else if (!newNode) {
    $parent.removChild($parent.childNodes[index])
  } else if (changed(newNode, oldNode)) {
    $parent.replaceChild(createElement(newNode), $parent.childNodes[index])
  } else if (newNode.type) {
    updateProps($parent.childNodes[index], newNode.props, oldNode.props)

    const newLength = newNode.children.length
    const oldLength = oldNode.children.length

    for (let i = 0; i < newLength || i < oldLength; i++) {
      updateElement(
        $parent.childNodes[index],
        newNode.children[i],
        oldNode.children[i],
        i
      )
    }
  }
}

// Test JSX elements to be made with a virtual dom

const a = (
  <ul className="list" style="list-style: none;">
    <li>item 1</li>
    <li>item 2</li>
  </ul>
)

const b = (
  <ul>
    <li>item 1</li>
    <li>HELLO</li>
    <div />
  </ul>
)

const c = (
  <ul style="list-style: none;">
    <li className="item">item 1</li>
    <li className="item">
      <input type="checkbox" checked={true} />
      <input type="text" disabled={false} />
    </li>
  </ul>
)

const d = (
  <ul style="list-style: none;">
    <li className="item item2">item 1</li>
    <li style="background: red;">
      <input type="checkbox" checked={false} />
      <input type="text" disabled={true} />
    </li>
  </ul>
)

const log = e => console.log(e.target.value)

const e = (
  <ul style="list-style: none;">
    <li className="item" onClick={() => alert('hi!')}>
      item 1
    </li>
    <li className="item">
      <input type="checkbox" checked={true} />
      <input type="text" onInput={log} />
    </li>
    {/* this node will always be updated */}
    <li forceUpdate={true}>text</li>
  </ul>
)

const f = (
  <ul style="list-style: none;">
    <li className="item item2" onClick={() => alert('hi!')}>
      item 1
    </li>
    <li style="background: red;">
      <input type="checkbox" checked={false} />
      <input type="text" onInput={log} />
    </li>
    {/* this node will always be updated */}
    <li forceUpdate={true}>text</li>
  </ul>
)

const $root = document.querySelector('#root')
const $reload = document.querySelector('#reload')

updateElement($root, e)

$reload.addEventListener('click', () => {
  updateElement($root, f, e)
})
