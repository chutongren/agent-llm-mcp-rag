# Difference between Interface and Abstract Class in Java

In Java, both interfaces and abstract classes are used to achieve abstraction, allowing classes to define methods without implementing them. However, there are several key differences between the two.

## 1. Purpose
- **Abstract Class**: Used when classes share a common behavior and have some default implementation. It can also include method definitions, fields, and constructors.
- **Interface**: Primarily used to define a contract that implementing classes must adhere to, providing only method signatures (until Java 8 introduced default methods).

## 2. Implementation
- **Abstract Class**: Can provide some method implementations and can have state (instance variables). Abstract methods must be implemented by subclasses. A class can extend only one abstract class due to single inheritance.
- **Interface**: Cannot provide any implementation (before Java 8). Interfaces can only include method declarations and static final variables. Starting from Java 8, interfaces can provide default implementations for methods but cannot have instance variables.

## 3. Inheritance
- **Abstract Class**: Supports single inheritance. A class can extend an abstract class and provide implementations for its abstract methods.
- **Interface**: Supports multiple inheritance. A class can implement multiple interfaces, allowing for more flexible designs.

## 4. Access Modifiers
- **Abstract Class**: Can have various access modifiers (private, protected, public, or package-private).
- **Interface**: All methods are implicitly public, and fields are static and final by default. Implementing classes cannot change these properties.

## 5. Constructor
- **Abstract Class**: Can have constructors that can be called from subclass constructors.
- **Interface**: Cannot have constructors because they cannot be instantiated directly.

## Conclusion
In summary, use an **abstract class** when you want to provide a common base for subclasses with shared implementation, and use an **interface** when you want to define a contract for classes that might share different implementations. Choosing between the two depends on the relationships among the classes and the intended design.