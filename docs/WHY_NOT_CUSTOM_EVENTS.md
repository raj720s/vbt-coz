# Why Not Use Custom Events? (Better Alternatives)

## The Problem with Custom Events

### Issues with `dispatchEvent` / Custom Events:

1. **Not Type-Safe**
   - No TypeScript checking for event names or payload structure
   - Easy to make typos in event names
   - No compile-time validation

2. **Hard to Debug**
   - Events are global and can be fired from anywhere
   - Difficult to trace where events originate
   - No clear call stack
   - Hard to set breakpoints

3. **Not React-Idiomatic**
   - React prefers props, context, or state management
   - Custom Events are DOM-level, not React-level
   - Breaks React's unidirectional data flow

4. **Memory Leaks Risk**
   - Event listeners must be manually cleaned up
   - Easy to forget to remove listeners
   - Can cause memory leaks if components unmount without cleanup

5. **Race Conditions**
   - Events are asynchronous and fire-and-forget
   - No guarantee of order
   - Can't easily chain or await events

6. **Testing Difficulties**
   - Hard to mock or test event dispatching
   - Requires DOM environment for testing
   - Can't easily verify event handlers were called

7. **No Error Handling**
   - If event listener throws error, it's hard to catch
   - No way to handle failures in event handlers
   - Silent failures are common

## Better Alternatives

### ✅ Solution: Logout Service (What We Implemented)

**Benefits:**
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Direct Redux integration**: Dispatches actions directly
- ✅ **Easy to debug**: Clear call stack, easy to set breakpoints
- ✅ **Testable**: Can be easily mocked and tested
- ✅ **No cleanup needed**: No event listeners to manage
- ✅ **Error handling**: Can use try/catch
- ✅ **Centralized**: Single source of truth for logout logic

**Example:**
```typescript
// ✅ Good: Direct service call
import { logoutService } from '@/services/logoutService';
logoutService.logout(true);

// ❌ Bad: Custom Event
window.dispatchEvent(new CustomEvent('forceLogout', {
  detail: { reason: 'Token expired' }
}));
```

### Other Alternatives (If Needed)

#### 1. **Callback Functions**
```typescript
// Pass callback to service
class TokenService {
  constructor(private onLogout: () => void) {}
  
  handleError() {
    this.onLogout();
  }
}
```

#### 2. **Observable Pattern** (RxJS)
```typescript
// Using RxJS Subject
const logoutSubject = new Subject<void>();
logoutSubject.subscribe(() => logout());

// Emit logout
logoutSubject.next();
```

#### 3. **Redux Actions Directly**
```typescript
// Dispatch directly from service
import { store } from '@/store';
import { logoutAction } from '@/store/slices/authSlice';

store.dispatch(logoutAction());
```

#### 4. **React Context with Callback**
```typescript
// Pass logout function via context
const AuthContext = createContext<{
  logout: () => void;
}>({ logout: () => {} });
```

## Our Implementation

We chose the **Logout Service** approach because:

1. **Works everywhere**: Can be used from utility files, services, components
2. **Type-safe**: Full TypeScript support
3. **Redux integration**: Directly dispatches Redux actions
4. **Centralized logic**: All logout logic in one place
5. **Easy to test**: Simple function calls, easy to mock
6. **No cleanup**: No event listeners to manage

## Migration from Custom Events

### Before (Custom Events):
```typescript
// ❌ Dispatching event
window.dispatchEvent(new CustomEvent('forceLogout', {
  detail: { reason: 'Token expired' }
}));

// ❌ Listening to event
useEffect(() => {
  const handler = (e: CustomEvent) => logout();
  window.addEventListener('forceLogout', handler);
  return () => window.removeEventListener('forceLogout', handler);
}, []);
```

### After (Logout Service):
```typescript
// ✅ Direct service call
import { logoutService } from '@/services/logoutService';
logoutService.logout(true);

// ✅ No listeners needed - service handles everything
```

## Best Practices

1. **Use services for cross-cutting concerns** (logout, notifications, etc.)
2. **Use Redux for state management** (not events)
3. **Use React Context for component-level state** (not global events)
4. **Use props for parent-child communication** (not events)
5. **Avoid Custom Events** unless absolutely necessary (rare cases like third-party integrations)

## Conclusion

Custom Events (`dispatchEvent`) are a **code smell** in React applications. They break React's patterns, make code harder to maintain, and introduce bugs. 

**Use services, Redux, or React patterns instead!**

