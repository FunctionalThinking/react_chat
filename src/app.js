import React from 'react';
import ReactDOM from 'react-dom'

function ThreadItem(props) {
  const backgroundColor = props.selected ? "blue" : "white";
  const color = props.selected ? "white" : "black";

  return (<div
      style={{display: 'flex', flexDirection: 'row', backgroundColor, color}}
      onClick={()=>props.onClick()}>
    <div style={{flex:2}}>
      {props.id}
    </div>
    <div>
      {props.unread}
    </div>
  </div>);
}

function ThreadList(props) {
  return (<div>
      {props.threadList.map((t, i) =>
        <ThreadItem key={i} {...t}
          onClick={() => props.onThreadSelected(i)}
          selected={i === props.currentThread}/>)}
    </div>);
}

function MessageItem(props) {
    return (<div style={{textIndent: "-20px", paddingLeft: "20px"}}>
        <i className="message-from">{props.message.from}</i>
        {" : "}
        {props.message.text}
      </div>);
}

function MessageList(props) {
  return (<div>
      <div>
        {props.messageList.map((m,i) => <MessageItem key={i} message={m}/>)}
      </div>
    </div>);
}

function Input(props) {
  function handleKeyDown(ev) {
    if (ev.keyCode === 13) {
      props.onInput();
    }
  }
  return (<div>
      <input placeholder="Send message" value={props.text}
        onKeyDown={handleKeyDown}
        onChange={(ev)=>props.onInputChange(ev.target.value)}/>
    </div>);
}

function ChatWindow(props) {
  return (<div>
      <MessageList messageList={props.messageList} title={props.title}/>
      <Input text={props.text}
          onInputChange={props.onInputChange}
          onInput={props.onInput}/>
    </div>);
}

function removeArray(arr, index) {
  const newArr = arr.slice(0);
  newArr.splice(index, 1);
  return newArr;
}

function insertArray(arr, index, item) {
  const newArr = arr.slice(0);
  newArr.splice(index, 0, item);
  return newArr;
}

function appendArray(arr, item) {
  return arr.concat(item);
}

function updateArray(arr, index, fn) {
  const newArr = arr.slice(0);
  const item = (typeof fn === 'function') ? fn(newArr[index]) : fn;
  newArr[index] = item;
  return newArr;
}

function updateObject(obj, key, fn) {
  const newObj = Object.assign({}, obj);
  const item = (typeof fn === 'function') ? fn(newObj[key]) : fn;
  newObj[key] = item;
  return newObj;
}

function findArray(arr, fn) {
  for (let index in arr) {
    if (fn(arr[index])) return index;
  }
  return -1;
}

const users = {

};

const API = {
  sendMessage: function sendMessage(from, to, text) {
    for (let name in users) {
      if (name === to) {
        users[name]({from, text});
        break;
      }
    }
  },
  register: function register(name, cb) {
    users[name] = cb;
    console.log(users);
    return {
      unsubscribe: function() {
        delete users[name];
      }
    }
  }
};

var ChatApp = React.createClass({
  getInitialState: function getInitialState() {
    return {
      currentThread: 0,
      threadList: this.props.friends.map(id => ({id, unread: 0, messageList: []})),
      text: ""
    }
  },
  componentDidMount: function componentDidMount() {
    this.subscription = API.register(this.props.self, m => {
      this.handleRemoteInput(m);
    });
  },
  componentWillUnmount: function componentWillUnmount() {
    this.subscription.unsubscribe();
  },
  handleInput: function handleInput() {
    const thread = this.state.threadList[this.state.currentThread];
    const threadList = removeArray(this.state.threadList, this.state.currentThread);
    const message = {
      from: this.props.self,
      text: this.state.text
    };
    const newThread = updateObject(thread, "messageList", (messageList) => appendArray(messageList, message));
    const newThreadList = insertArray(threadList, 0, newThread);
    this.setState({
      text: "",
      currentThread: 0,
      threadList: newThreadList
    });
    API.sendMessage(this.props.self, thread.id, this.state.text);
  },
  handleRemoteInput: function handleRemoteInput(message) {
    const index = findArray(this.state.threadList, (thread) => thread.id === message.from);
    if (index < 0) return;
    const threadList = updateArray(this.state.threadList, index, (thread) => {
      const unread = this.state.currentThread === index ? 0 : thread.unread + 1;
      return Object.assign(updateObject(thread, "messageList", (messageList) => appendArray(messageList, message)), {unread});
    });
    this.setState({
      threadList
    })
  },
  handleThreadSelected: function handleThreadSelected(index) {
    if (index === this.state.currentThread)
      return;
    const newThreadList = updateArray(this.state.threadList, index, (thread) => {
      return updateObject(thread, "unread", 0);
    });
    this.setState({
      currentThread: index,
      text: "",
      threadList: newThreadList
    })
  },
  render: function render() {
    const thread = this.state.threadList[this.state.currentThread];
    return (<div style={{display: 'flex', flexDirection:'column'}}>
      <div style={{backgroundColor:"black", color:"white", textAlign:"center", fontSize:"larger"}}>{this.props.self}</div>
      <div style={{display: 'flex', flexDirection:'row'}} >
        <ThreadList threadList={this.state.threadList}
          currentThread={this.state.currentThread}
          onThreadSelected={this.handleThreadSelected}/>
        <ChatWindow text={this.state.text}
          messageList={thread.messageList}
          title={thread.id}
          onInputChange={text => this.setState({text: text})}
          onInput={this.handleInput}/>
      </div>
    </div>);
  }
});

function TestApp(props) {
  return (<div style={{display:'flex', flexDirection: 'column'}}>
  <div style={{flex:1,display:'flex', flexDirection: 'row'}}>
    <div style={{flex: 1}}><ChatApp self="me" friends={["bob", "mary", "sally"]}/></div>
    <div style={{flex: 1}}><ChatApp self="bob" friends={["me", "mary", "sally"]}/></div>
  </div>
  <div style={{flex:1,display:'flex', flexDirection: 'row'}}>
    <div style={{flex: 1}}><ChatApp self="mary" friends={["bob", "me", "sally"]}/></div>
    <div style={{flex: 1}}><ChatApp self="sally" friends={["bob", "mary", "me"]}/></div>
  </div>
  </div>)
}
ReactDOM.render(<TestApp />, document.getElementById('app'));
