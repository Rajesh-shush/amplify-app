import React, { useState, useEffect } from 'react';
import './App.css';
import { API,Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listTodos } from './graphql/queries';
import { createTodo as createTodoMutation, deleteTodo as deleteTodoMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }

function App() {
  const [Todos, setTodos] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function onChange(e){
    if(!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({...formData,image:file.name});
    await Storage.put(file.name,file);
    fetchTodos();
  }

  async function fetchTodos(){
    const apiData = await API.graphql({query: listTodos});
    const todosFromAPI = apiData.data.listTodos.items;
    await Promise.all(todosFromAPI.map(async todo =>{
      if(todosFromAPI.image){
        const image = await Storage.get(todo.image);
        todo.image = image;
      }
      return todo;
    }))
    setTodos(apiData.data.listTodos.items);
  }

  async function createTodo() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createTodoMutation, variables: { input: formData } });
    if(formData.image){
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setTodos([ ...Todos, formData ]);
    setFormData(initialFormState);
  }

  async function deleteTodo({ id }) {
    const newTodosArray = Todos.filter(Todo => Todo.id !== id);
    setTodos(newTodosArray);
    await API.graphql({ query: deleteTodoMutation, variables: { input: { id } }});
  }

  return (
    <div className="App">
      <h1>My Todos App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Todo name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Todo description"
        value={formData.description}
      />
      
      <button onClick={createTodo}>Create Todo</button>
      <div style={{marginBottom: 30}}>
        {
          Todos.map(Todo => (
            <div key={Todo.id || Todo.name}>
              <h2>{Todo.name}</h2>
              <p>{Todo.description}</p>
              <button onClick={() => deleteTodo(Todo)}>Delete Todo</button>
              {Todo.image && <img src={Todo.image} style={{width:400}}/>}
            </div>
          ))
        }
      </div>
      <input
       type="file"
       onChange={onChange}
      />
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);