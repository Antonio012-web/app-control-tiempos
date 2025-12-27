// navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import JobsListScreen    from '../screens/JobsListScreen';
import AddJobScreen      from '../screens/AddJobScreen';
import EditJobScreen     from '../screens/EditJobScreen';
import JobDetailScreen   from '../screens/JobDetailScreen';
import SummaryScreen     from '../screens/SummaryScreen';
import EditRegistroScreen from '../screens/EditRegistroScreen';  // ✅ importa aquí

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="JobsList">
      <Stack.Screen name="JobsList"  component={JobsListScreen}    options={{ title: 'Mis Jobs'       }} />
      <Stack.Screen name="AddJob"    component={AddJobScreen}      options={{ title: 'Nuevo Job'     }} />
      <Stack.Screen name="EditJob"   component={EditJobScreen}     options={{ title: 'Editar Job'    }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen}   options={{ title: 'Detalles Job'  }} />
      <Stack.Screen name="Summary"   component={SummaryScreen}     options={{ title: 'Resumen'       }} />
      {/* Agrega esta línea para el editor de registros */}
      <Stack.Screen name="EditRegistro" component={EditRegistroScreen} options={{ title: 'Editar Registro' }} />
    </Stack.Navigator>
  );
}
