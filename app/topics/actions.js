/* eslint consistent-return: 0, no-else-return: 0*/
import { polyfill } from 'es6-promise';
import request from 'axios';
import md5 from 'spark-md5';

export const CREATE_TOPIC_REQUEST = 'CREATE_TOPIC_REQUEST';
export const CREATE_TOPIC_FAILURE = 'CREATE_TOPIC_FAILURE';
export const CREATE_TOPIC_SUCCESS = 'CREATE_TOPIC_SUCCESS';
export const CREATE_TOPIC_DUPLICATE = 'CREATE_TOPIC_DUPLICATE';
export const GET_TOPICS = 'GET_TOPICS';
export const GET_TOPICS_REQUEST = 'GET_TOPICS_REQUEST';
export const GET_TOPICS_SUCCESS = 'GET_TOPICS_SUCCESS';
export const GET_TOPICS_FAILURE = 'GET_TOPICS_FAILURE';
export const INCREMENT_COUNT = 'INCREMENT_COUNT';
export const DECREMENT_COUNT = 'DECREMENT_COUNT';
export const DESTROY_TOPIC = 'DESTROY_TOPIC';
export const TYPING = 'TYPING';

polyfill();

/*
 * Utility function to make AJAX requests using isomorphic fetch.
 * You can also use jquery's $.ajax({}) if you do not want to use the
 * /fetch API.
 * Note: this function relies on an external variable `API_ENDPOINT`
 *        and isn't a pure function
 * @param Object Data you wish to pass to the server
 * @param String HTTP method, e.g. post, get, put, delete
 * @param String endpoint
 * @return Promise
 */
export function makeTopicRequest(method, id, data, api = '/topic') {
  return request[method](api + (id ? ('/' + id) : ''), data);
}

export function increment(id) {
  return { type: INCREMENT_COUNT, id };
}

export function decrement(id) {
  return { type: DECREMENT_COUNT, id };
}

export function destroy(id) {
  return { type: DESTROY_TOPIC, id };
}


export function typing(text) {
  return {
    type: TYPING,
    newTopic: text
  };
}

/*
 * @param data
 * @return a simple JS object
 */
export function createTopicRequest(data) {
  return {
    type: CREATE_TOPIC_REQUEST,
    id: data.id,
    count: data.count,
    text: data.text
  };
}

export function createTopicSuccess() {
  return {
    type: CREATE_TOPIC_SUCCESS
  };
}

export function createTopicFailure(data) {
  return {
    type: CREATE_TOPIC_FAILURE,
    id: data.id,
    error: data.error
  };
}

export function createTopicDuplicate() {
  return {
    type: CREATE_TOPIC_DUPLICATE
  };
}

// This action creator returns a function,
// which will get executed by Redux-Thunk middleware
// This function does not need to be pure, and thus allowed
// to have side effects, including executing asynchronous API calls.
export function createTopic(text) {
  return (dispatch, getState) => {
    // If the text box is empty
    if (text.trim().length <= 0) return;

    const id = md5.hash(text);
    // Redux thunk's middleware receives the store methods `dispatch`
    // and `getState` as parameters
    const { topic } = getState();
    const data = {
      count: 1,
      id,
      text
    };

    // Conditional dispatch
    // If the topic already exists, make sure we emit a dispatch event
    if (topic.topics.filter(topicItem => topicItem.id === id).length > 0) {
      // Currently there is no reducer that changes state for this
      // For production you would ideally have a message reducer that
      // notifies the user of a duplicate topic
      return dispatch(createTopicDuplicate());
    }

    // First dispatch an optimistic update
    dispatch(createTopicRequest(data));

    return makeTopicRequest('post', id, data)
      .then(res => {
        if (res.status === 200) {
          // We can actually dispatch a CREATE_TOPIC_SUCCESS
          // on success, but I've opted to leave that out
          // since we already did an optimistic update
          // We could return res.json();
          return dispatch(createTopicSuccess());
        }
      })
      .catch(() => {
        return dispatch(createTopicFailure({ id, error: 'Oops! Something went wrong and we couldn\'t create your topic'}));
      });
  };
}

// Fetch posts logic
export function fetchTopics() {
  return {
    type: GET_TOPICS,
    promise: makeTopicRequest('get')
  };
}


export function incrementCount(id) {
  return dispatch => {
    return makeTopicRequest('put', id, {
        isFull: false,
        isIncrement: true
      })
      .then(() => dispatch(increment(id)))
      .catch(() => dispatch(createTopicFailure({id, error: 'Oops! Something went wrong and we couldn\'t add your vote'})));
  };
}

export function decrementCount(id) {
  return dispatch => {
    return makeTopicRequest('put', id, {
        isFull: false,
        isIncrement: false
      })
      .then(() => dispatch(decrement(id)))
      .catch(() => dispatch(createTopicFailure({id, error: 'Oops! Something went wrong and we couldn\'t add your vote'})));
  };
}

export function destroyTopic(id) {
  return dispatch => {
    return makeTopicRequest('delete', id)
      .then(() => dispatch(destroy(id)))
      .catch(() => dispatch(createTopicFailure({id,
        error: 'Oops! Something went wrong and we couldn\'t add your vote'})));
  };
}