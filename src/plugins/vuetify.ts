import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

const customTheme = {
    dark: false,
    colors: {
        primary: '#2E7D32', // Yeşil ton (tenis teması)
        secondary: '#4CAF50',
        accent: '#81C784',
        error: '#F44336',
        warning: '#FF9800',
        info: '#2196F3',
        success: '#4CAF50',
        background: '#FAFAFA',
        surface: '#FFFFFF'
    }
}

export default createVuetify({
    components,
    directives,
    icons: {
        defaultSet: 'mdi',
        sets: {
            mdi
        }
    },
    theme: {
        defaultTheme: 'customTheme',
        themes: {
            customTheme
        }
    }
})