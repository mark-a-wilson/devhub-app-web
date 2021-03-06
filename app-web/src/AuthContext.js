/*
Copyright 2019 Province of British Columbia

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at 

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Created by Patrick Simonian
*/

import React, { useEffect, useState } from 'react';
import { useImplicitAuth } from './utils/hooks';
import queryString from 'query-string';
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';

const AuthContext = React.createContext({});

// Auth Provider is already wrapping gatsby browser so all pages should have access to the context
export const AuthProvider = ({ children, location, ...rest }) => {
  const [searchString, setSearchString] = useState({});
  useEffect(() => {
    setSearchString(window.location.search);
  }, [searchString]);
  const search = queryString.parse(searchString);
  const auth = useImplicitAuth(search.intention);
  let isAuthenticated = false;

  if (!isEmpty(auth)) {
    const now = new Date();
    const { exp } = auth.idToken.data;
    // jwt times are in seconds, multiply by 1000 to convert into a date object
    const expDate = new Date(exp * 1000);
    // parse out auth.id_token and see if its still valid
    if (moment(now).isBefore(moment(expDate))) {
      isAuthenticated = true;
    }
  }
  return <AuthContext.Provider value={{ auth, isAuthenticated }}>{children}</AuthContext.Provider>;
};

/**
 * usage is <AuthConsumer>{props => (...)}</AuthConsumer>
 */
export const AuthConsumer = AuthContext.Consumer;
/**
 * usage is useContext(AuthContext)
 */
export default AuthContext;
