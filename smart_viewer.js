logo_dis_DELAY  = 500
logo_dis_TIME   = 2500
dis_delay = 500
dis_TIME  = 1000
upd_TIME   = 500


class Timer
{
    constructor(func, timeout)
    {
        this.func = func;
        this.timeout = timeout;
        this.running = false;
    }
    start() 
    {
        if (!this.running)
        {
            this.timer = setTimeout(this._exec.bind(this), this.timeout);
            this.running = true
        }
    }
    _exec() 
    {
        this.func()
        this.running = false
    }
    stop() 
    {
        if (this.running) 
        {
            clearTimeout(this.timer)
            this.running = false
        }
    }
}

class smartlogo 
{
    constructor() 
    {
        this.show_timer = new Timer(this._show.bind(this), logo_dis_DELAY)
        this.cross_timer = new Timer(this._cross.bind(this), logo_dis_TIME)
        this.logo = this.build_logo()
    }
    show(url, posX, posY) 
    {
        if (this.logo.style.visibility == 'hidden')
        {
            this.url = url
            this.pos = this._getlogoPosition(posX, posY)
            this.show_timer.stop()
            this.show_timer.start()
        }
    }
    _show() 
    {
        this.logo.style.left = this.pos.x + "px";
        this.logo.style.top  = this.pos.y + "px";
        this.logo.style.visibility = 'visible';
        this.cross_timer.start()
    }
    _cross() 
    {
        this.logo.style.visibility = 'hidden';
    }

    build_logo()
    {
        let logo = document.createElement("img");
        logo.setAttribute("src", browser.extension.getURL("photo/hover.png"));
        logo.setAttribute("id", "smart_viewer_logo");
        logo.style.visibility = 'hidden';
        document.body.appendChild(logo);
        logo.addEventListener("mouseover", this._on_mouseover.bind(this))
        logo.addEventListener("mouseout", this._on_mouseout.bind(this))
        return logo
    }
    _getlogoPosition(cursorX, cursorY)
    {
        const offsetX = 20
        const offsetY = 10
        const pos_trsh = 20
        let posX = cursorX + offsetX
        if (posX + pos_trsh > window.innerWidth)
        {
            posX -= offsetX * 2
        }
        let posY = cursorY + offsetY
        if (posY + pos_trsh > window.innerHeight)
        {
            posY -= offsetY * 2
        }
        return {x:posX, y:posY}
    }
    _on_mouseover(e)
    {
        this.cross_timer.stop()
        smart_frame.show(this.url)
    }
    _on_mouseout(e)
    {
        this.cross_timer.start()
        smart_frame.cross()
    }
}

class smartFrame 
{
    constructor() 
    {
        this._dis = false;
        this.show_timer = new Timer(this._show.bind(this), dis_delay)
        this.cross_timer = new Timer(this._cross.bind(this), dis_TIME)
        this.upd_timer = new Timer(this._upd.bind(this), upd_TIME)
        this.locked = false
        this.frame = this.build_frame()
        this.iframe = this.frame.querySelector('#nyk_content')
    }
    get dis() 
    {
        return this._dis
    }
    show(url) 
    {
        this.url = url
        this.show_timer.start()
        this.cross_timer.stop()
    }
    _show() 
    {
        this._dis = true;
        this.iframe.src = this.url
        this.frame.style.visibility = 'visible';
    }
    cross() 
    {
        if (!this.locked) 
        {
            this.cross_timer.start()
        }
        this.show_timer.stop()
        this.upd_timer.stop()
    }
    _cross() 
    {
        this._dis = false;
        this.iframe.src = "about:blank"
        this.frame.style.visibility = 'hidden';
    }
    upd(url) 
    {
        this.url = url
        this.cross_timer.stop()
        this.upd_timer.start()
    }
    _upd() 
    {
        if (this.iframe.src != this.url)
        {

            this.iframe.src = this.url
        }
        this.cross_timer.stop()
    }
    build_frame()
    {
        let frame = document.createElement("div");
        frame.setAttribute("id", "nyk_frame");
        frame.style.visibility = 'hidden';
        frame.innerHTML = `
          <div class="nyk_toolbar">
            <div id="logo"></div>
              <div class="nyk_btn_group" id="pin">
              <button class="nyk_btn" id="tag" title="Keep frame open"></button>
              <button class="nyk_btn" id="cross" title="cross frame"></button>
            </div>
          </div>
          <div id="nyk_vresize"></div>
          <iframe id="nyk_content"></iframe>
        `
                      
        browser.storage.local.get("width_percentage").then((settings) => 
        {
            if (settings.width_percentage) 
            {
                frame.style.width = settings.width_percentage + "%"
            }
        }) 

        frame.querySelector('#tag').addEventListener("click", this._on_tag_click.bind(this))
        frame.querySelector('#cross').addEventListener("click", this._on_cross_click.bind(this))

        frame.querySelector('#nyk_vresize').addEventListener("mousedown", this._on_vresizer_mousedown.bind(this))

        document.body.appendChild(frame);
        frame.addEventListener("mouseenter", this._on_mouseover.bind(this))
        frame.addEventListener("mouseleave", this._on_mouseout.bind(this))
        return frame
    }

    
    _on_tag_click(e) 
    {
        let btn = e.target
        this.locked = !this.locked
        this.locked ? btn.setAttribute('locked', 'yes') : btn.removeAttribute('locked')
    }
    _on_cross_click(e) 
    {
        this._cross()
    }
    _on_mouseover(e)
    {
        this.cross_timer.stop()
    }
    _on_mouseout(e)
    {
        if (!this.locked) 
        {
            this.cross_timer.start()
        }
    }

    _on_vresizer_mousedown(e) 
    {
        const document_width = document.body.clientWidth

        let frame = this.frame                                  
        let resizer = frame.querySelector('#nyk_vresize')
        resizer.style.width = '100%'                           

        const old_document_onmousedown = document.onmousedown
        document.onmousedown = () => {return false}         

        document.onmousemove = function(e) 
        {
            const width = document_width - e.clientX
            frame.style.width = width + 'px'
        }

        document.onmouseup = function() 
        {
            resizer.style.width = null                        
            const width_percentage = Math.floor(100 * frame.clientWidth/document_width) 
            frame.style.width = width_percentage + "%"
            browser.storage.local.set({
                width_percentage: width_percentage
            });
            document.onmousemove = null;
            document.onmouseup = null;
            document.onmousedown = old_document_onmousedown
        }
    }

}
let smart_logo = new smartlogo()
let smart_frame = new smartFrame()

let links = document.querySelectorAll('a')

document.addEventListener('mouseover', on_link_mouseover_doc)
document.addEventListener('mouseout', on_link_mouseout_doc)

function on_link_mouseover_doc(e)
{
    if (e.target.nodeName == 'A')
    {
        let url = e.target.href

        if (smart_frame.dis) 
        {
            smart_frame.upd(url)
        } 
        else 
        {
            smart_logo.show(url, e.clientX, e.clientY)
        }
    }
    else if (e.type == "mouseover") 
    { 
         let parent = {target: e.target.parentNode, clientX: e.clientX, clientY: e.clientY}

        on_link_mouseover_doc(parent)
    }
}

function on_link_mouseout_doc(e) 
{
    if (e.target.nodeName == 'A')
    {
        if (smart_frame.dis) 
        {
            smart_frame.cross()
        }
    }
}
