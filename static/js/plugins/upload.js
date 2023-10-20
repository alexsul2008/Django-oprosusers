
const element = (tag, classes = [], content) => {
    const node = document.createElement(tag)

    if (classes.length){
        node.classList.add(...classes)
    }

    if(content){
        node.textContent = content
    }
    return node
}

function noop() {}

const upload = (selector, options={}) => {
    const onUpload = options.onUpload ?? noop
    const input = document.querySelector(selector)

    const openBtn = element('button', ['btn'], 'Открыть')

    if (options.accept && Array.isArray(options.accept)){
        input.setAttribute('accept', options.accept.join(', '))
    }

    input.insertAdjacentElement('afterend', openBtn)

    const triggerInput = () => input.click()





    openBtn.addEventListener('click', triggerInput)

}